import { z } from 'zod';
import { router, orgProcedure } from '../trpc';

const eventTypeEnum = z.enum(['grant_deadline', 'report_due', 'milestone', 'submission', 'award']);

export const calendarRouter = router({
  getEvents: orgProcedure
    .input(z.object({
      start: z.date(),
      end: z.date(),
      type: eventTypeEnum.optional(),
      grantId: z.string().optional(),
      funderId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.organizationId;

      const events = [];

      // Build grant filter based on input
      const grantFilter = {
        organizationId: orgId,
        ...(input.grantId && { id: input.grantId }),
        ...(input.funderId && { funderId: input.funderId }),
      };

      // Get grant deadline events
      if (!input.type || input.type === 'grant_deadline') {
        const grants = await ctx.db.grant.findMany({
          where: {
            ...grantFilter,
            deadline: {
              gte: input.start,
              lte: input.end,
            },
          },
          include: {
            funder: true,
            opportunity: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        events.push(...grants.map(g => ({
          id: `grant-deadline-${g.id}`,
          title: g.opportunity?.title || g.funder?.name || 'Untitled Grant',
          date: g.deadline!,
          type: 'grant_deadline' as const,
          grantId: g.id,
          funderId: g.funderId,
          funderName: g.funder?.name,
          opportunityId: g.opportunity?.id,
          opportunityTitle: g.opportunity?.title || g.funder?.name,
        })));
      }

      // Get submission date events
      if (!input.type || input.type === 'submission') {
        const grants = await ctx.db.grant.findMany({
          where: {
            ...grantFilter,
            submittedAt: {
              gte: input.start,
              lte: input.end,
            },
          },
          include: {
            funder: true,
            opportunity: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        events.push(...grants.map(g => ({
          id: `submission-${g.id}`,
          title: `Submission: ${g.opportunity?.title || g.funder?.name || 'Untitled Grant'}`,
          date: g.submittedAt!,
          type: 'submission' as const,
          grantId: g.id,
          funderId: g.funderId,
          funderName: g.funder?.name,
          opportunityId: g.opportunity?.id,
          opportunityTitle: g.opportunity?.title || g.funder?.name,
        })));
      }

      // Get award date events
      if (!input.type || input.type === 'award') {
        const grants = await ctx.db.grant.findMany({
          where: {
            ...grantFilter,
            awardedAt: {
              gte: input.start,
              lte: input.end,
            },
          },
          include: {
            funder: true,
            opportunity: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        events.push(...grants.map(g => ({
          id: `award-${g.id}`,
          title: `Awarded: ${g.opportunity?.title || g.funder?.name || 'Untitled Grant'}`,
          date: g.awardedAt!,
          type: 'award' as const,
          grantId: g.id,
          funderId: g.funderId,
          funderName: g.funder?.name,
          opportunityId: g.opportunity?.id,
          opportunityTitle: g.opportunity?.title || g.funder?.name,
        })));
      }

      // Get report due events from commitments
      if (!input.type || input.type === 'report_due') {
        const commitments = await ctx.db.commitment.findMany({
          where: {
            organizationId: orgId,
            type: 'REPORT_DUE',
            dueDate: {
              gte: input.start,
              lte: input.end,
            },
            ...(input.grantId && { grantId: input.grantId }),
            ...(input.funderId && {
              grant: {
                funderId: input.funderId,
              },
            }),
          },
          include: {
            grant: {
              include: {
                opportunity: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
                funder: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        events.push(...commitments.map(c => ({
          id: `report-${c.id}`,
          title: `Report: ${c.description}`,
          date: c.dueDate!,
          type: 'report_due' as const,
          grantId: c.grantId,
          funderId: c.grant?.funder?.id,
          funderName: c.grant?.funder?.name,
          opportunityId: c.grant?.opportunity?.id,
          opportunityTitle: c.grant?.opportunity?.title || c.grant?.funder?.name,
        })));
      }

      // Get milestone events from other commitment types
      if (!input.type || input.type === 'milestone') {
        const commitments = await ctx.db.commitment.findMany({
          where: {
            organizationId: orgId,
            type: {
              not: 'REPORT_DUE',
            },
            dueDate: {
              gte: input.start,
              lte: input.end,
            },
            ...(input.grantId && { grantId: input.grantId }),
            ...(input.funderId && {
              grant: {
                funderId: input.funderId,
              },
            }),
          },
          include: {
            grant: {
              include: {
                opportunity: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
                funder: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        events.push(...commitments.map(c => ({
          id: `milestone-${c.id}`,
          title: c.description,
          date: c.dueDate!,
          type: 'milestone' as const,
          grantId: c.grantId,
          funderId: c.grant?.funder?.id,
          funderName: c.grant?.funder?.name,
          opportunityId: c.grant?.opportunity?.id,
          opportunityTitle: c.grant?.opportunity?.title || c.grant?.funder?.name,
        })));
      }

      return events;
    }),

  createEvent: orgProcedure
    .input(z.object({
      title: z.string(),
      date: z.date(),
      type: z.enum(['deadline', 'meeting', 'phase']),
      opportunityId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement custom calendar event creation
      // Would need a CalendarEvent model in schema
      return {
        id: 'temp-id',
        ...input,
      };
    }),

  updateEvent: orgProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      date: z.date().optional(),
      type: z.enum(['deadline', 'meeting', 'phase']).optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement event update
      return { success: true, ...input };
    }),

  deleteEvent: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Implement event deletion
      return { success: true, id: input.id };
    }),
});
