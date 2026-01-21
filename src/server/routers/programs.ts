import { z } from 'zod'
import { router, orgProcedure } from '../trpc'

export const programsRouter = router({
  /**
   * List all programs for the organization with grant counts
   */
  list: orgProcedure.query(async ({ ctx }) => {
    const programs = await ctx.db.program.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            grants: true,
          },
        },
      },
    })

    return programs
  }),

  /**
   * Create a new program
   */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Program name is required'),
        description: z.string().optional(),
        budget: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.program.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
        },
        include: {
          _count: {
            select: {
              grants: true,
            },
          },
        },
      })

      return program
    }),
})