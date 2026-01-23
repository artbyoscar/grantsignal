import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const calendarRouter = router({
  getEvents: protectedProcedure
    .input(
      z.object({
        start: z.date(),
        end: z.date(),
        type: z.enum(['deadline', 'meeting', 'phase']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get opportunities with deadlines
      const opportunities = await ctx.db.opportunity.findMany({
        where: {
          userId,
          deadline: {
            gte: input.start,
            lte: input.end,
          },
        },
        select: {
          id: true,
          title: true,
          deadline: true,
        },
      });

      const events = [];

      // Add deadline events
      if (!input.type || input.type === 'deadline') {
        for (const opp of opportunities) {
          if (opp.deadline) {
            events.push({
              id: `deadline-${opp.id}`,
              title: `${opp.title} - Deadline`,
              date: opp.deadline,
              type: 'deadline' as const,
              opportunityId: opp.id,
              opportunityTitle: opp.title,
            });
          }
        }
      }

      // Add phase events (if phases are tracked in the database)
      // This is a placeholder - adjust based on your schema
      if (!input.type || input.type === 'phase') {
        // TODO: Implement phase tracking if needed
      }

      // Add meeting events (if meetings are tracked in the database)
      // This is a placeholder - adjust based on your schema
      if (!input.type || input.type === 'meeting') {
        // TODO: Implement meeting tracking if needed
      }

      return events;
    }),

  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        date: z.date(),
        type: z.enum(['deadline', 'meeting', 'phase']),
        opportunityId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // TODO: Implement event creation
      // This would require adding an events table to your schema
      // For now, this is a placeholder

      return {
        id: 'temp-id',
        ...input,
      };
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        date: z.date().optional(),
        type: z.enum(['deadline', 'meeting', 'phase']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement event update
      return { success: true };
    }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement event deletion
      return { success: true };
    }),
});
