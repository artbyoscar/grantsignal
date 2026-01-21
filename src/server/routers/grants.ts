import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { GrantStatus, FunderType } from '@prisma/client'

export const grantsRouter = router({
  /**
   * List all grants with filters and cursor-based pagination
   */
  list: orgProcedure
    .input(
      z.object({
        status: z.nativeEnum(GrantStatus).optional(),
        statuses: z.array(z.nativeEnum(GrantStatus)).optional(),
        programId: z.string().optional(),
        funderType: z.nativeEnum(FunderType).optional(),
        assignedToId: z.string().optional(),
        deadlineFrom: z.date().optional(),
        deadlineTo: z.date().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[grants.list] Starting query with organizationId:', ctx.organizationId);
        console.log('[grants.list] Input:', input);

        const { cursor, limit, status, statuses, programId, funderType, assignedToId, deadlineFrom, deadlineTo } = input

        const grants = await ctx.db.grant.findMany({
          where: {
            organizationId: ctx.organizationId,
            ...(status && { status }),
            ...(statuses && statuses.length > 0 && { status: { in: statuses } }),
            ...(programId && { programId }),
            ...(assignedToId && { assignedToId }),
            ...(funderType && {
              funder: {
                type: funderType,
              },
            }),
            ...(deadlineFrom || deadlineTo
              ? {
                  deadline: {
                    ...(deadlineFrom && { gte: deadlineFrom }),
                    ...(deadlineTo && { lte: deadlineTo }),
                  },
                }
              : {}),
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
            assignedTo: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                clerkUserId: true,
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

        console.log('[grants.list] Found grants:', grants.length);

        let nextCursor: string | undefined = undefined
        if (grants.length > limit) {
          const nextItem = grants.pop()
          nextCursor = nextItem?.id
        }

        console.log('[grants.list] Returning grants:', grants.length, 'nextCursor:', nextCursor);
        return {
          grants,
          nextCursor,
        }
      } catch (error) {
        console.error('[grants.list] Error details:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          organizationId: ctx.organizationId,
          input,
        });
        throw error;
      }
    }),

  /**
   * Get single grant by ID with full details
   */
  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const grant = await ctx.db.grant.findFirst({
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
      const grant = await ctx.db.grant.create({
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

      const grant = await ctx.db.grant.updateMany({
        where: {
          id,
          organizationId: ctx.organizationId,
        },
        data,
      })

      if (grant.count === 0) {
        throw new Error('Grant not found or access denied')
      }

      return ctx.db.grant.findUnique({
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
      const grant = await ctx.db.grant.updateMany({
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

      return ctx.db.grant.findUnique({
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
      const grant = await ctx.db.grant.deleteMany({
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

  /**
   * Assign a grant to a team member
   */
  assignGrant: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the grant belongs to the organization
      const grant = await ctx.db.grant.findFirst({
        where: {
          id: input.grantId,
          organizationId: ctx.organizationId,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      })

      if (!grant) {
        throw new Error('Grant not found or access denied')
      }

      // Verify the user is a member of the organization
      const user = await ctx.db.organizationUser.findFirst({
        where: {
          id: input.userId,
          organizationId: ctx.organizationId,
        },
      })

      if (!user) {
        throw new Error('User not found in organization')
      }

      // Update the grant
      const updatedGrant = await ctx.db.grant.update({
        where: { id: input.grantId },
        data: {
          assignedToId: input.userId,
          assignedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              clerkUserId: true,
            },
          },
        },
      })

      // Log activity
      await ctx.db.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType: 'GRANT_ASSIGNED',
          description: `Assigned grant to ${user.displayName || 'team member'}`,
          performedBy: ctx.auth.userId!,
          metadata: {
            grantId: input.grantId,
            previousAssigneeId: grant.assignedToId,
            previousAssigneeName: grant.assignedTo?.displayName,
            newAssigneeId: input.userId,
            newAssigneeName: user.displayName,
          },
        },
      })

      return updatedGrant
    }),

  /**
   * Unassign a grant from a team member
   */
  unassignGrant: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the grant belongs to the organization
      const grant = await ctx.db.grant.findFirst({
        where: {
          id: input.grantId,
          organizationId: ctx.organizationId,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      })

      if (!grant) {
        throw new Error('Grant not found or access denied')
      }

      // Update the grant
      const updatedGrant = await ctx.db.grant.update({
        where: { id: input.grantId },
        data: {
          assignedToId: null,
          assignedAt: null,
        },
      })

      // Log activity
      await ctx.db.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType: 'GRANT_UNASSIGNED',
          description: `Unassigned grant from ${grant.assignedTo?.displayName || 'team member'}`,
          performedBy: ctx.auth.userId!,
          metadata: {
            grantId: input.grantId,
            previousAssigneeId: grant.assignedToId,
            previousAssigneeName: grant.assignedTo?.displayName,
          },
        },
      })

      return updatedGrant
    }),
})
