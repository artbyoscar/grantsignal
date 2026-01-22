import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { generateWithMemory } from '../services/ai/writer'
import { queryOrganizationMemory } from '../services/ai/rag'
import { anthropic } from '@/lib/anthropic'
import { TRPCError } from '@trpc/server'

export const aiRouter = router({
  /**
   * Generate grant writing content with organizational memory (legacy)
   * @deprecated Use generateWithSources for full audit trail support
   */
  generate: orgProcedure
    .input(
      z.object({
        prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
        grantId: z.string().optional(),
        mode: z.enum(['generate', 'refine', 'expand']).default('generate'),
        existingContent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[ai.generate] Starting generation:', {
          organizationId: ctx.organizationId,
          mode: input.mode,
          promptLength: input.prompt.length,
          hasExistingContent: !!input.existingContent,
        })

        const result = await generateWithMemory({
          prompt: input.prompt,
          organizationId: ctx.organizationId,
          grantId: input.grantId,
          mode: input.mode,
          existingContent: input.existingContent,
        })

        console.log('[ai.generate] Generation successful:', {
          confidence: result.confidence,
          sourcesFound: result.sources.length,
          tokensUsed: result.tokensUsed,
        })

        return result
      } catch (error) {
        console.error('[ai.generate] Generation failed:', error)
        throw new Error(
          `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }),

  /**
   * Generate content with full source attribution and audit logging
   * Implements V3 Trust Architecture with 60% confidence threshold
   */
  generateWithSources: orgProcedure
    .input(
      z.object({
        prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
        grantId: z.string().optional(),
        sectionId: z.string().optional(),
        writingMode: z
          .enum(['memory_assist', 'ai_draft', 'human_first'])
          .default('memory_assist'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[ai.generateWithSources] Starting generation:', {
          organizationId: ctx.organizationId,
          grantId: input.grantId,
          sectionId: input.sectionId,
          writingMode: input.writingMode,
        })

        // Verify grant access if provided
        if (input.grantId) {
          const grant = await ctx.db.grant.findFirst({
            where: {
              id: input.grantId,
              organizationId: ctx.organizationId,
            },
          })

          if (!grant) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Grant not found or access denied',
            })
          }
        }

        // Step 1: Query RAG system for relevant sources
        const contexts = await queryOrganizationMemory({
          query: input.prompt,
          organizationId: ctx.organizationId,
          topK: 10,
          minScore: 0.7,
        })

        console.log(`[ai.generateWithSources] Found ${contexts.length} relevant contexts`)

        // Step 2: Calculate confidence score
        const averageScore =
          contexts.length > 0
            ? contexts.reduce((sum, ctx) => sum + ctx.score, 0) / contexts.length
            : 0

        // Confidence formula: weighted scoring
        // - Context quantity: up to 40 points (10 contexts = full 40)
        // - Average relevance: up to 60 points (1.0 score = full 60)
        const contextQuantityScore = Math.min((contexts.length / 10) * 40, 40)
        const relevanceScore = averageScore * 60
        const confidence = Math.round(contextQuantityScore + relevanceScore)

        console.log('[ai.generateWithSources] Confidence calculation:', {
          contextsFound: contexts.length,
          averageScore: averageScore.toFixed(3),
          confidence,
        })

        // Format sources for response
        const sources = contexts.map((ctx) => ({
          documentId: ctx.documentId,
          documentName: ctx.documentName,
          text: ctx.text.slice(0, 500), // Preview
          score: Math.round(ctx.score * 100),
          chunkIndex: ctx.chunkIndex,
        }))

        // Step 3: V3 Trust Architecture - Check confidence threshold
        if (confidence < 60) {
          console.log(
            '[ai.generateWithSources] Confidence below threshold - returning sources only'
          )

          return {
            shouldGenerate: false,
            content: null,
            confidence,
            sources,
            generatedAt: new Date(),
            auditId: null,
            message: `Cannot confidently generate content (confidence: ${confidence}%). Here are relevant sources for manual review.`,
          }
        }

        // Step 4: Build context string for Claude
        const contextString = contexts
          .map(
            (ctx, idx) =>
              `<source id="${idx + 1}" document="${ctx.documentName}" relevance="${Math.round(ctx.score * 100)}%">
${ctx.text}
</source>`
          )
          .join('\n\n')

        // Step 5: Build system prompt
        const systemPrompt = buildSystemPrompt(input.writingMode, input.sectionId, contexts.length)

        // Step 6: Build user message
        const userMessage = `# Organizational Context

${contextString}

# Task

${input.prompt}

${input.sectionId ? `# Section\n\nYou are writing the "${input.sectionId}" section of a grant proposal.` : ''}`

        // Step 7: Call Claude API
        console.log('[ai.generateWithSources] Calling Claude API...')
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        })

        // Step 8: Extract content from response
        const content = response.content[0].type === 'text' ? response.content[0].text : ''

        // Step 9: Log to audit trail
        const auditLog = await ctx.db.aIGeneration.create({
          data: {
            organizationId: ctx.organizationId,
            grantId: input.grantId,
            userId: ctx.auth.userId!,
            sectionId: input.sectionId,
            prompt: input.prompt,
            content,
            confidence,
            sources: contexts.map((ctx) => ({
              documentId: ctx.documentId,
              documentName: ctx.documentName,
              text: ctx.text,
              score: ctx.score,
              chunkIndex: ctx.chunkIndex,
            })),
            writingMode: input.writingMode,
            model: 'claude-sonnet-4-5-20250929',
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          },
        })

        console.log('[ai.generateWithSources] Generation successful:', {
          auditId: auditLog.id,
          confidence,
          sourcesUsed: contexts.length,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        })

        return {
          shouldGenerate: true,
          content,
          confidence,
          sources,
          generatedAt: auditLog.generatedAt,
          auditId: auditLog.id,
          message: `Content generated with ${confidence}% confidence based on ${contexts.length} relevant sources.`,
        }
      } catch (error) {
        console.error('[ai.generateWithSources] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get sources for a specific piece of generated content
   * Retrieves source attribution details from audit trail
   */
  getSourcesForContent: orgProcedure
    .input(
      z.object({
        contentId: z.string().optional(),
        generatedAt: z.date().optional(),
        grantId: z.string().optional(),
        sectionId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[ai.getSourcesForContent] Fetching sources:', {
          contentId: input.contentId,
          generatedAt: input.generatedAt,
          grantId: input.grantId,
          sectionId: input.sectionId,
        })

        // Build query based on input
        let aiGeneration

        if (input.contentId) {
          // Query by audit ID
          aiGeneration = await ctx.db.aIGeneration.findFirst({
            where: {
              id: input.contentId,
              organizationId: ctx.organizationId,
            },
          })
        } else if (input.generatedAt || (input.grantId && input.sectionId)) {
          // Query by timestamp or grant+section
          const where: any = {
            organizationId: ctx.organizationId,
          }

          if (input.generatedAt) {
            where.generatedAt = input.generatedAt
          }
          if (input.grantId) {
            where.grantId = input.grantId
          }
          if (input.sectionId) {
            where.sectionId = input.sectionId
          }

          aiGeneration = await ctx.db.aIGeneration.findFirst({
            where,
            orderBy: {
              generatedAt: 'desc',
            },
          })
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Must provide contentId, generatedAt, or grantId+sectionId',
          })
        }

        if (!aiGeneration) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Content not found or access denied',
          })
        }

        // Extract sources from JSON field
        const sources = aiGeneration.sources as any[]

        // Fetch full document details for each source
        const documentIds = [...new Set(sources.map((s) => s.documentId))]
        const documents = await ctx.db.document.findMany({
          where: {
            id: { in: documentIds },
            organizationId: ctx.organizationId,
          },
          select: {
            id: true,
            name: true,
            type: true,
            grantId: true,
            grant: {
              select: {
                id: true,
                funder: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })

        // Map documents by ID for quick lookup
        const documentMap = new Map(documents.map((d) => [d.id, d]))

        // Enrich sources with full document details
        const enrichedSources = sources.map((source) => {
          const doc = documentMap.get(source.documentId)
          return {
            id: source.documentId,
            documentId: source.documentId,
            documentName: source.documentName,
            documentType: doc?.type || 'OTHER',
            relevanceScore: Math.round(source.score * 100),
            excerpt: source.text,
            chunkIndex: source.chunkIndex,
            grantId: doc?.grantId,
            funderName: doc?.grant?.funder?.name,
          }
        })

        console.log('[ai.getSourcesForContent] Found sources:', {
          count: enrichedSources.length,
          confidence: aiGeneration.confidence,
        })

        return {
          sources: enrichedSources,
          generatedAt: aiGeneration.generatedAt,
          confidence: aiGeneration.confidence,
          prompt: aiGeneration.prompt,
          writingMode: aiGeneration.writingMode,
          model: aiGeneration.model,
        }
      } catch (error) {
        console.error('[ai.getSourcesForContent] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch sources: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),
})

/**
 * Build system prompt based on generation mode
 */
function buildSystemPrompt(
  mode: 'memory_assist' | 'ai_draft' | 'human_first',
  sectionId: string | undefined,
  contextsFound: number
): string {
  const basePrompt = `You are an expert grant writer helping a nonprofit organization create compelling proposal content.

${sectionId ? `You are writing the "${sectionId}" section of a grant proposal.\n` : ''}
You have access to ${contextsFound} relevant documents from the organization's memory. Use this information to ground your writing in the organization's actual work, mission, and past achievements.

Mode: ${mode === 'memory_assist' ? 'Memory Assist - Help the writer by suggesting content based on organizational memory' : mode === 'ai_draft' ? 'AI Draft - Generate a complete draft based on organizational memory' : 'Human First - Provide minimal assistance, letting the human writer take the lead'}

Guidelines:
- Write in a clear, professional, and compelling style
- Use specific details from the organizational context
- Ground all claims in evidence from the provided sources
- Match the tone and style typical of grant proposals
- Do not make up information not present in the context
- If information is missing, acknowledge it rather than fabricating
- Always cite sources by referencing the source document name

CRITICAL: All generated content MUST include source attribution. Reference specific documents when making claims.

Output only the requested content without preamble or meta-commentary.`

  return basePrompt
}
