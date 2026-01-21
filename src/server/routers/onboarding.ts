import { z } from 'zod'
import { router, orgProcedure } from '../trpc'

export const onboardingRouter = router({
  /**
   * Get current onboarding status
   */
  getStatus: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        name: true,
        ein: true,
        mission: true,
        primaryProgramAreas: true,
        geographicArea: true,
        _count: {
          select: {
            documents: true,
          },
        },
      },
    })

    return org
  }),

  /**
   * Update organization details (step 2)
   */
  updateOrganization: orgProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Organization name is required'),
        ein: z.string().optional(),
        mission: z.string().min(10, 'Mission statement should be at least 10 characters').optional(),
        primaryProgramAreas: z.array(z.string()).min(1, 'Select at least one program area'),
        geographicArea: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: {
          name: input.name,
          ein: input.ein || null,
          mission: input.mission || null,
          primaryProgramAreas: input.primaryProgramAreas,
          geographicArea: input.geographicArea || null,
          onboardingStep: 3,
        },
      })

      return updated
    }),

  /**
   * Mark onboarding as complete
   */
  complete: orgProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.db.organization.update({
      where: { id: ctx.organizationId },
      data: {
        onboardingCompleted: true,
        onboardingStep: null,
      },
    })

    return updated
  }),

  /**
   * Update current step
   */
  updateStep: orgProcedure
    .input(
      z.object({
        step: z.number().min(1).max(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: {
          onboardingStep: input.step,
        },
      })

      return updated
    }),
})
