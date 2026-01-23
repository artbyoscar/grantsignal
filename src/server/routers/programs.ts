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

  /**
   * Update a program
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, 'Program name is required').optional(),
        description: z.string().optional(),
        budget: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verify program belongs to organization
      const program = await ctx.db.program.findFirst({
        where: {
          id,
          organizationId: ctx.organizationId,
        },
      })

      if (!program) {
        throw new Error('Program not found')
      }

      const updated = await ctx.db.program.update({
        where: { id },
        data,
        include: {
          _count: {
            select: {
              grants: true,
            },
          },
        },
      })

      return updated
    }),

  /**
   * Delete (soft delete) a program
   */
  delete: orgProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify program belongs to organization
      const program = await ctx.db.program.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      })

      if (!program) {
        throw new Error('Program not found')
      }

      // Soft delete
      await ctx.db.program.update({
        where: { id: input.id },
        data: { isActive: false },
      })

      return { success: true }
    }),
})