import { z } from 'zod'
import { router, orgProcedure } from '../trpc'

export const organizationsRouter = router({
  /**
   * Get current organization details
   */
  getById: orgProcedure.query(async ({ ctx }) => {
    return ctx.organization
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
      const updated = await ctx.prisma.organization.update({
        where: { id: ctx.organizationId },
        data: input,
      })

      return updated
    }),

  /**
   * Get voice analysis profile data
   */
  getVoiceProfile: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        voiceProfile: true,
        voiceUpdatedAt: true,
      },
    })

    return org
  }),
})
