import { z } from 'zod';
import { router, orgProcedure } from '../trpc';
import { logActivity, ActivityActions } from '@/lib/activity-logger';

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

      // Get custom calendar events
      const customEvents = await ctx.db.calendarEvent.findMany({
        where: {
          organizationId: orgId,
          date: {
            gte: input.start,
            lte: input.end,
          },
          ...(input.grantId && { grantId: input.grantId }),
        },
        include: {
          grant: {
            select: {
              id: true,
              funder: { select: { id: true, name: true } },
              opportunity: { select: { id: true, title: true } },
            },
          },
        },
      });

      events.push(...customEvents.map(e => ({
        id: `custom-${e.id}`,
        title: e.title,
        date: e.date,
        type: e.type as 'grant_deadline' | 'report_due' | 'milestone' | 'submission' | 'award',
        grantId: e.grantId,
        funderId: e.grant?.funder?.id,
        funderName: e.grant?.funder?.name,
        opportunityId: e.grant?.opportunity?.id,
        opportunityTitle: e.grant?.opportunity?.title || e.grant?.funder?.name,
        isCustom: true,
      })));

      return events;
    }),

  createEvent: orgProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      date: z.date(),
      endDate: z.date().optional(),
      type: z.enum(['deadline', 'meeting', 'phase', 'reminder']),
      grantId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.calendarEvent.create({
        data: {
          organizationId: ctx.organizationId,
          title: input.title,
          description: input.description,
          date: input.date,
          endDate: input.endDate,
          type: input.type,
          grantId: input.grantId,
          createdBy: ctx.auth.userId!,
        },
      });

      logActivity({
        organizationId: ctx.organizationId,
        userId: ctx.auth.userId,
        action: ActivityActions.CALENDAR_EVENT_CREATED,
        entityType: 'calendarEvent',
        entityId: event.id,
        description: `Created calendar event "${input.title}"`,
        metadata: { type: input.type, date: input.date.toISOString() },
      });

      return event;
    }),

  updateEvent: orgProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      date: z.date().optional(),
      endDate: z.date().optional(),
      type: z.enum(['deadline', 'meeting', 'phase', 'reminder']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // Only update fields that were provided
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.type !== undefined) updateData.type = data.type;

      const event = await ctx.db.calendarEvent.update({
        where: { id, organizationId: ctx.organizationId },
        data: updateData,
      });
      return event;
    }),

  deleteEvent: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.calendarEvent.delete({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      return { success: true, id: input.id };
    }),
});
