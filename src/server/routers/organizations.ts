import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { inngest } from '@/inngest/client'
import { rewriteInOrganizationVoice, type VoiceProfile } from '../services/ai/voice-analyzer'

export const organizationsRouter = router({
  /**
   * Get current organization details
   */
  getById: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.organizationId },
    })
    return org
  }),

  /**
   * Update organization profile
   */
  update: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        ein: z.string().optional(),
        mission: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: input,
      })

      return updated
    }),

  /**
   * Get voice analysis profile data
   */
  getVoiceProfile: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        voiceProfile: true,
        voiceUpdatedAt: true,
        _count: {
          select: {
            documents: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
      },
    })

    if (!org?.voiceProfile) {
      return null
    }

    // Type-safe access to nested voiceProfile structure
    const voiceData = org.voiceProfile as any

    return {
      profile: voiceData.profile as VoiceProfile | null,
      metadata: voiceData.metadata
        ? {
            documentsAnalyzed: voiceData.metadata.documentsAnalyzed as number,
            lastUpdated: new Date(voiceData.metadata.lastUpdated),
            confidence: voiceData.metadata.confidence as 'high' | 'medium' | 'low',
          }
        : null,
      availableDocuments: org._count.documents,
    }
  }),

  /**
   * Update voice profile settings (merge with existing profile)
   */
  updateVoiceProfile: orgProcedure
    .input(
      z.object({
        patterns: z
          .array(
            z.object({
              type: z.enum(['opening', 'transition', 'evidence', 'closing']),
              enabled: z.boolean(),
            })
          )
          .optional(),
        preferredTerms: z.record(z.string(), z.string()).optional(),
        avoidedTerms: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch existing profile
      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: {
          voiceProfile: true,
        },
      })

      if (!org?.voiceProfile) {
        throw new Error('No voice profile exists. Run voice analysis first.')
      }

      const existingProfile = org.voiceProfile as any
      const profile = existingProfile.profile as VoiceProfile

      // Merge updates
      if (input.patterns) {
        // Update enabled status for matching pattern types
        profile.patterns = profile.patterns.map(p => {
          const update = input.patterns?.find(u => u.type === p.type)
          return update ? { ...p, enabled: update.enabled } : p
        })
      }

      if (input.preferredTerms) {
        profile.vocabulary.preferredTerms = {
          ...profile.vocabulary.preferredTerms,
          ...input.preferredTerms,
        }
      }

      if (input.avoidedTerms) {
        profile.vocabulary.avoidedTerms = [
          ...new Set([...profile.vocabulary.avoidedTerms, ...input.avoidedTerms]),
        ]
      }

      // Save updated profile
      const updated = await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: {
          voiceProfile: {
            profile,
            metadata: existingProfile.metadata,
          } as any,
        },
        select: {
          voiceProfile: true,
        },
      })

      const updatedData = updated.voiceProfile as any

      return {
        profile: updatedData.profile as VoiceProfile,
        metadata: updatedData.metadata,
      }
    }),

  /**
   * Trigger voice analysis (long-running Inngest job)
   */
  analyzeVoice: orgProcedure
    .input(
      z.object({
        forceRefresh: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Trigger the Inngest function
      await inngest.send({
        name: 'voice/analyze',
        data: {
          organizationId: ctx.organizationId,
          forceRefresh: input.forceRefresh,
        },
      })

      return {
        status: 'processing',
        message: 'Voice analysis started. This may take a few minutes.',
      }
    }),

  /**
   * Compare generic text with organization's voice
   */
  getVoiceComparison: orgProcedure
    .input(
      z.object({
        sampleText: z.string().min(10).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch voice profile
      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: {
          voiceProfile: true,
        },
      })

      if (!org?.voiceProfile) {
        throw new Error('No voice profile exists. Run voice analysis first.')
      }

      const voiceData = org.voiceProfile as any
      const profile = voiceData.profile as VoiceProfile

      // Rewrite using organization's voice
      const comparison = await rewriteInOrganizationVoice(input.sampleText, profile)

      return comparison
    }),
})
