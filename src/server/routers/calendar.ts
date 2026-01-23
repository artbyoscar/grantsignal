import { z } from 'zod';
import { router, orgProcedure } from '../trpc';

export const calendarRouter = router({
  getEvents: orgProcedure
    .input(z.object({
      start: z.date(),
      end: z.date(),
      type: z.enum(['deadline', 'meeting', 'phase']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.organizationId;

      const events = [];

      // Get deadline events from grants
      if (!input.type || input.type === 'deadline') {
        const grants = await ctx.db.grant.findMany({
          where: {
            organizationId: orgId,
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
          id: `deadline-${g.id}`,
          title: g.opportunity?.title || g.funder?.name || 'Untitled Grant',
          date: g.deadline!,
          type: 'deadline' as const,
          opportunityId: g.opportunity?.id,
          opportunityTitle: g.opportunity?.title || g.funder?.name,
        })));
      }

      // Get phase events from commitments
      if (!input.type || input.type === 'phase') {
        const commitments = await ctx.db.commitment.findMany({
          where: {
            organizationId: orgId,
            dueDate: {
              gte: input.start,
              lte: input.end,
            },
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
                    name: true,
                  },
                },
              },
            },
          },
        });

        events.push(...commitments.map(c => ({
          id: `phase-${c.id}`,
          title: c.description,
          date: c.dueDate!,
          type: 'phase' as const,
          opportunityId: c.grant?.opportunity?.id,
          opportunityTitle: c.grant?.opportunity?.title || c.grant?.funder?.name,
        })));
      }

      // TODO: Add meeting events when meetings table is implemented
      // if (!input.type || input.type === 'meeting') {
      //   // Implement meeting tracking
      // }

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
