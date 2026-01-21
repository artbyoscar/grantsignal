import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import {
  analyzeOrganizationVoice,
  rewriteInVoice,
  getOrganizationVoice,
} from '../services/ai/voice'
import { calculateConfidence } from '../services/ai/voice-analyzer'
import { TRPCError } from '@trpc/server'

export const voiceRouter = router({
  /**
   * Get organization's current voice profile
   */
  getProfile: orgProcedure.query(async ({ ctx }) => {
    try {
      const voiceProfile = await getOrganizationVoice(ctx.organizationId)

      if (!voiceProfile) {
        return null
      }

      // Get document count for confidence calculation
      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: {
          voiceUpdatedAt: true,
          _count: {
            select: {
              documents: {
                where: { status: 'COMPLETED' },
              },
            },
          },
        },
      })

      const documentCount = org?._count.documents || 0
      const confidence = calculateConfidence(documentCount)

      return {
        profile: voiceProfile,
        metadata: {
          lastUpdated: org?.voiceUpdatedAt || new Date(),
          documentsAnalyzed: documentCount,
          confidence,
        },
      }
    } catch (error) {
      console.error('[Voice Router] Failed to get profile:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve voice profile',
      })
    }
  }),

  /**
   * Analyze organization voice from documents
   * This triggers a full re-analysis of organizational documents
   */
  analyze: orgProcedure
    .input(
      z.object({
        forceRefresh: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get all completed documents for analysis
        const documents = await ctx.db.document.findMany({
          where: {
            organizationId: ctx.organizationId,
            status: 'COMPLETED',
          },
          select: {
            id: true,
            name: true,
            type: true,
            extractedText: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 20, // Analyze up to 20 most recent documents
        })

        if (documents.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No documents available for voice analysis. Please upload at least 5 documents.',
          })
        }

        if (documents.length < 5 && !input.forceRefresh) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Only ${documents.length} document(s) available. At least 5 documents are recommended for accurate voice analysis.`,
          })
        }

        // Prepare documents for analysis
        const documentsForAnalysis = documents
          .filter(doc => doc.extractedText && doc.extractedText.trim().length > 100)
          .map(doc => ({
            text: doc.extractedText || '',
            type: doc.type,
          }))

        if (documentsForAnalysis.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No documents with sufficient text content for analysis.',
          })
        }

        // Perform voice analysis
        const voiceProfile = await analyzeOrganizationVoice(
          ctx.organizationId,
          documentsForAnalysis
        )

        const confidence = calculateConfidence(documentsForAnalysis.length)

        return {
          success: true,
          message: `Voice analysis complete. Analyzed ${documentsForAnalysis.length} documents.`,
          confidence,
          profile: voiceProfile,
        }
      } catch (error) {
        console.error('[Voice Router] Analysis failed:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Voice analysis failed',
        })
      }
    }),

  /**
   * Apply voice profile to rewrite text
   * This is the main integration point for the Writing Studio
   */
  applyToText: orgProcedure
    .input(
      z.object({
        text: z.string().min(10, 'Text must be at least 10 characters').max(10000, 'Text is too long'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the organization's voice profile
        const voiceProfile = await getOrganizationVoice(ctx.organizationId)

        if (!voiceProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No voice profile found. Please run voice analysis first.',
          })
        }

        // Rewrite the text using the voice profile
        const rewrittenText = await rewriteInVoice(input.text, voiceProfile)

        return {
          original: input.text,
          rewritten: rewrittenText,
          appliedProfile: {
            formality: voiceProfile.tone.formality,
            directness: voiceProfile.tone.directness,
            complexity: voiceProfile.tone.complexity,
          },
        }
      } catch (error) {
        console.error('[Voice Router] Apply to text failed:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to apply voice to text',
        })
      }
    }),

  /**
   * Analyze text consistency with voice profile
   * Returns a consistency score and suggestions for improvement
   */
  analyzeConsistency: orgProcedure
    .input(
      z.object({
        text: z.string().min(10).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const voiceProfile = await getOrganizationVoice(ctx.organizationId)

        if (!voiceProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No voice profile found. Please run voice analysis first.',
          })
        }

        // Simple consistency analysis
        const text = input.text
        const words = text.split(/\s+/)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

        // Calculate metrics
        const avgSentenceLength = words.length / Math.max(sentences.length, 1)
        const shortSentenceCount = sentences.filter(s => s.trim().split(/\s+/).length < 10).length
        const shortRatio = shortSentenceCount / Math.max(sentences.length, 1)

        // Compare with voice profile
        const lengthDiff = Math.abs(avgSentenceLength - voiceProfile.sentencePatterns.avgLength)
        const ratioDiff = Math.abs(shortRatio - voiceProfile.sentencePatterns.shortSentenceRatio)

        // Calculate consistency score (0-100)
        const lengthScore = Math.max(0, 100 - lengthDiff * 5)
        const ratioScore = Math.max(0, 100 - ratioDiff * 100)
        const consistencyScore = Math.round((lengthScore + ratioScore) / 2)

        // Check for avoided terms
        const avoidedTermsFound = voiceProfile.vocabulary.avoidedTerms.filter(term =>
          text.toLowerCase().includes(term.toLowerCase())
        )

        // Generate suggestions
        const suggestions: string[] = []

        if (lengthDiff > 5) {
          if (avgSentenceLength > voiceProfile.sentencePatterns.avgLength) {
            suggestions.push('Consider breaking up longer sentences to match your typical style')
          } else {
            suggestions.push('Consider combining some shorter sentences')
          }
        }

        if (avoidedTermsFound.length > 0) {
          suggestions.push(
            `Consider avoiding these terms: ${avoidedTermsFound.join(', ')}`
          )
        }

        // Check for preferred terms
        const preferredTermsMap = voiceProfile.vocabulary.preferredTerms
        Object.entries(preferredTermsMap).forEach(([from, to]) => {
          if (text.toLowerCase().includes(from.toLowerCase())) {
            suggestions.push(`Consider using "${to}" instead of "${from}"`)
          }
        })

        if (suggestions.length === 0 && consistencyScore >= 80) {
          suggestions.push('Text matches your organizational voice well!')
        }

        return {
          consistencyScore,
          level: consistencyScore >= 80 ? 'high' : consistencyScore >= 60 ? 'medium' : 'low',
          suggestions,
          metrics: {
            avgSentenceLength: Math.round(avgSentenceLength),
            shortRatio: Math.round(shortRatio * 100),
            targetAvgLength: voiceProfile.sentencePatterns.avgLength,
            targetShortRatio: Math.round(
              voiceProfile.sentencePatterns.shortSentenceRatio * 100
            ),
          },
        }
      } catch (error) {
        console.error('[Voice Router] Consistency analysis failed:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze text consistency',
        })
      }
    }),
})
