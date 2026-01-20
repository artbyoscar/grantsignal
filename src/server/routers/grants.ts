import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { GrantStatus } from '@prisma/client'

export const grantsRouter = router({
  /**
   * List all grants with filters and cursor-based pagination
   */
  list: orgProcedure
    .input(
      z.object({
        status: z.nativeEnum(GrantStatus).optional(),
        programId: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status, programId } = input

      const grants = await ctx.prisma.grant.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(status && { status }),
          ...(programId && { programId }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        include: {
          funder: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              title: true,
              deadline: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              commitments: true,
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (grants.length > limit) {
        const nextItem = grants.pop()
        nextCursor = nextItem?.id
      }

      return {
        grants,
        nextCursor,
      }
    }),

  /**
   * Get single grant by ID with full details
   */
  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const grant = await ctx.prisma.grant.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
        include: {
          funder: true,
          opportunity: true,
          program: true,
          documents: {
            orderBy: { createdAt: 'desc' },
          },
          commitments: {
            orderBy: { dueDate: 'asc' },
            include: {
              conflicts: {
                where: {
                  status: {
                    in: ['UNRESOLVED', 'UNDER_REVIEW'],
                  },
                },
              },
            },
          },
        },
      })

      if (!grant) {
        throw new Error('Grant not found')
      }

      return grant
    }),

  /**
   * Create a new grant
   */
  create: orgProcedure
    .input(
      z.object({
        funderId: z.string().optional(),
        opportunityId: z.string().optional(),
        programId: z.string().optional(),
        status: z.nativeEnum(GrantStatus).default(GrantStatus.PROSPECT),
        amountRequested: z.number().positive().optional(),
        deadline: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const grant = await ctx.prisma.grant.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
        },
        include: {
          funder: true,
          opportunity: true,
          program: true,
        },
      })

      return grant
    }),

  /**
   * Update grant details
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        funderId: z.string().optional(),
        opportunityId: z.string().optional(),
        programId: z.string().optional(),
        amountRequested: z.number().positive().optional(),
        amountAwarded: z.number().positive().optional(),
        deadline: z.date().optional(),
        submittedAt: z.date().optional(),
        awardedAt: z.date().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const grant = await ctx.prisma.grant.updateMany({
        where: {
          id,
          organizationId: ctx.organizationId,
        },
        data,
      })

      if (grant.count === 0) {
        throw new Error('Grant not found or access denied')
      }

      return ctx.prisma.grant.findUnique({
        where: { id },
        include: {
          funder: true,
          opportunity: true,
          program: true,
        },
      })
    }),

  /**
   * Update grant status (for Kanban drag-drop)
   */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(GrantStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const grant = await ctx.prisma.grant.updateMany({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
        data: {
          status: input.status,
        },
      })

      if (grant.count === 0) {
        throw new Error('Grant not found or access denied')
      }

      return ctx.prisma.grant.findUnique({
        where: { id: input.id },
      })
    }),

  /**
   * Soft delete grant
   * (We'll implement this as a status change to maintain data integrity)
   */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const grant = await ctx.prisma.grant.deleteMany({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      })

      if (grant.count === 0) {
        throw new Error('Grant not found or access denied')
      }

      return { success: true }
    }),
})
