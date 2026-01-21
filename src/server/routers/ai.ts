import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { generateWithMemory } from '../services/ai/writer'

export const aiRouter = router({
  /**
   * Generate grant writing content with organizational memory
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
})
