import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

/**
 * Audit Router
 * Handles AI generation audit logging and retrieval for compliance
 */
export const auditRouter = router({
  /**
   * Log an AI generation event with full audit trail
   * Called automatically after each AI generation
   */
  logGeneration: orgProcedure
    .input(
      z.object({
        grantId: z.string().optional(),
        prompt: z.string(),
        content: z.string(),
        confidence: z.number().min(0).max(100),
        sources: z.array(
          z.object({
            documentId: z.string(),
            documentName: z.string(),
            text: z.string(),
            score: z.number(),
            chunkIndex: z.number().optional(),
          })
        ),
        writingMode: z.string(),
        sectionId: z.string().optional(),
        model: z.string().optional().default('claude-sonnet-4-5-20250929'),
        tokensUsed: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[audit.logGeneration] Logging AI generation:', {
          organizationId: ctx.organizationId,
          grantId: input.grantId,
          sectionId: input.sectionId,
          confidence: input.confidence,
          sourcesCount: input.sources.length,
        })

        // Verify grant access if grantId provided
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

        // Create audit log entry
        const aiGeneration = await ctx.db.aIGeneration.create({
          data: {
            organizationId: ctx.organizationId,
            grantId: input.grantId,
            userId: ctx.auth.userId,
            sectionId: input.sectionId,
            prompt: input.prompt,
            content: input.content,
            confidence: input.confidence,
            sources: input.sources,
            writingMode: input.writingMode,
            model: input.model,
            tokensUsed: input.tokensUsed,
          },
        })

        console.log('[audit.logGeneration] Audit log created:', {
          auditId: aiGeneration.id,
          generatedAt: aiGeneration.generatedAt,
        })

        return {
          auditId: aiGeneration.id,
          generatedAt: aiGeneration.generatedAt,
          message: 'Generation logged successfully',
        }
      } catch (error) {
        console.error('[audit.logGeneration] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to log generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get generation history for a grant
   * Returns all AI generations with full audit trail
   */
  getGenerationHistory: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
        sectionId: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(), // For pagination
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[audit.getGenerationHistory] Fetching history:', {
          grantId: input.grantId,
          sectionId: input.sectionId,
          limit: input.limit,
        })

        // Verify grant access
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

        // Build query filters
        const where = {
          grantId: input.grantId,
          organizationId: ctx.organizationId,
          ...(input.sectionId && { sectionId: input.sectionId }),
        }

        // Fetch generation history with cursor-based pagination
        const generations = await ctx.db.aIGeneration.findMany({
          where,
          take: input.limit + 1, // Fetch one extra to determine if there are more
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: {
            generatedAt: 'desc',
          },
          select: {
            id: true,
            userId: true,
            sectionId: true,
            prompt: true,
            content: true,
            confidence: true,
            sources: true,
            writingMode: true,
            model: true,
            tokensUsed: true,
            generatedAt: true,
          },
        })

        // Determine if there are more results
        let nextCursor: string | undefined = undefined
        if (generations.length > input.limit) {
          const nextItem = generations.pop() // Remove the extra item
          nextCursor = nextItem!.id
        }

        console.log('[audit.getGenerationHistory] Found generations:', {
          count: generations.length,
          hasMore: !!nextCursor,
        })

        return {
          generations,
          nextCursor,
        }
      } catch (error) {
        console.error('[audit.getGenerationHistory] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch generation history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get all AI generations for an organization
   * Useful for compliance reporting and analytics
   */
  getOrganizationHistory: orgProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        minConfidence: z.number().min(0).max(100).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[audit.getOrganizationHistory] Fetching org history:', {
          organizationId: ctx.organizationId,
          startDate: input.startDate,
          endDate: input.endDate,
          minConfidence: input.minConfidence,
        })

        // Build query filters
        const where: any = {
          organizationId: ctx.organizationId,
        }

        if (input.startDate || input.endDate) {
          where.generatedAt = {}
          if (input.startDate) where.generatedAt.gte = input.startDate
          if (input.endDate) where.generatedAt.lte = input.endDate
        }

        if (input.minConfidence !== undefined) {
          where.confidence = { gte: input.minConfidence }
        }

        // Fetch generation history with cursor-based pagination
        const generations = await ctx.db.aIGeneration.findMany({
          where,
          take: input.limit + 1,
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: {
            generatedAt: 'desc',
          },
          select: {
            id: true,
            grantId: true,
            userId: true,
            sectionId: true,
            confidence: true,
            writingMode: true,
            model: true,
            tokensUsed: true,
            generatedAt: true,
            grant: {
              select: {
                id: true,
                status: true,
                funder: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        })

        // Determine if there are more results
        let nextCursor: string | undefined = undefined
        if (generations.length > input.limit) {
          const nextItem = generations.pop()
          nextCursor = nextItem!.id
        }

        console.log('[audit.getOrganizationHistory] Found generations:', {
          count: generations.length,
          hasMore: !!nextCursor,
        })

        return {
          generations,
          nextCursor,
        }
      } catch (error) {
        console.error('[audit.getOrganizationHistory] Error:', error)

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch organization history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get analytics summary for AI usage
   * Provides insights into generation patterns and confidence levels
   */
  getUsageAnalytics: orgProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[audit.getUsageAnalytics] Calculating analytics:', {
          organizationId: ctx.organizationId,
          startDate: input.startDate,
          endDate: input.endDate,
        })

        // Build query filters
        const where: any = {
          organizationId: ctx.organizationId,
        }

        if (input.startDate || input.endDate) {
          where.generatedAt = {}
          if (input.startDate) where.generatedAt.gte = input.startDate
          if (input.endDate) where.generatedAt.lte = input.endDate
        }

        // Fetch all generations for analytics
        const generations = await ctx.db.aIGeneration.findMany({
          where,
          select: {
            confidence: true,
            writingMode: true,
            tokensUsed: true,
            generatedAt: true,
            sources: true,
          },
        })

        // Calculate analytics
        const totalGenerations = generations.length
        const totalTokens = generations.reduce((sum, g) => sum + (g.tokensUsed || 0), 0)
        const averageConfidence =
          totalGenerations > 0
            ? generations.reduce((sum, g) => sum + g.confidence, 0) / totalGenerations
            : 0

        // Confidence distribution
        const highConfidence = generations.filter((g) => g.confidence >= 80).length
        const mediumConfidence = generations.filter((g) => g.confidence >= 60 && g.confidence < 80)
          .length
        const lowConfidence = generations.filter((g) => g.confidence < 60).length

        // Mode distribution
        const modeDistribution = generations.reduce(
          (acc, g) => {
            acc[g.writingMode] = (acc[g.writingMode] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        // Average sources used
        const averageSources =
          totalGenerations > 0
            ? generations.reduce((sum, g) => {
                const sources = g.sources as any[]
                return sum + (sources?.length || 0)
              }, 0) / totalGenerations
            : 0

        console.log('[audit.getUsageAnalytics] Analytics calculated:', {
          totalGenerations,
          averageConfidence: Math.round(averageConfidence),
        })

        return {
          totalGenerations,
          totalTokens,
          averageConfidence: Math.round(averageConfidence),
          confidenceDistribution: {
            high: highConfidence,
            medium: mediumConfidence,
            low: lowConfidence,
          },
          modeDistribution,
          averageSources: Math.round(averageSources * 10) / 10,
        }
      } catch (error) {
        console.error('[audit.getUsageAnalytics] Error:', error)

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to calculate analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),
})
