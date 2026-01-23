import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clerkClient } from '@clerk/nextjs/server';

export const notificationsRouter = router({
  // Get current user's notification preferences
  getPreferences: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Find the organization user record
    const orgUser = await ctx.db.organizationUser.findFirst({
      where: { clerkUserId: ctx.auth.userId },
      include: { notificationPreferences: true },
    });

    if (!orgUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // If preferences don't exist yet, return default values
    if (!orgUser.notificationPreferences) {
      // Get user email from Clerk
      const client = await clerkClient();
      const user = await client.users.getUser(ctx.auth.userId);
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

      return {
        id: null,
        email: email || '',
        deadlineRemindersEnabled: true,
        weeklyDigestEnabled: true,
        complianceAlertsEnabled: true,
        documentProcessedEnabled: false,
        reminderThresholds: [7, 3, 1],
        digestFrequency: 'WEEKLY' as const,
      };
    }

    return orgUser.notificationPreferences;
  }),

  // Update notification preferences
  updatePreferences: publicProcedure
    .input(
      z.object({
        deadlineRemindersEnabled: z.boolean().optional(),
        weeklyDigestEnabled: z.boolean().optional(),
        complianceAlertsEnabled: z.boolean().optional(),
        documentProcessedEnabled: z.boolean().optional(),
        reminderThresholds: z.array(z.number()).optional(),
        digestFrequency: z.enum(['DAILY', 'WEEKLY', 'NONE']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find the organization user record
      const orgUser = await ctx.db.organizationUser.findFirst({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Get user email from Clerk
      const client = await clerkClient();
      const user = await client.users.getUser(ctx.auth.userId);
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

      if (!email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User email not found',
        });
      }

      // Upsert notification preferences
      const preferences = await ctx.db.notificationPreferences.upsert({
        where: { userId: orgUser.id },
        create: {
          userId: orgUser.id,
          email,
          deadlineRemindersEnabled: input.deadlineRemindersEnabled ?? true,
          weeklyDigestEnabled: input.weeklyDigestEnabled ?? true,
          complianceAlertsEnabled: input.complianceAlertsEnabled ?? true,
          documentProcessedEnabled: input.documentProcessedEnabled ?? false,
          reminderThresholds: input.reminderThresholds ?? [7, 3, 1],
          digestFrequency: input.digestFrequency ?? 'WEEKLY',
        },
        update: {
          email,
          ...(input.deadlineRemindersEnabled !== undefined && {
            deadlineRemindersEnabled: input.deadlineRemindersEnabled,
          }),
          ...(input.weeklyDigestEnabled !== undefined && {
            weeklyDigestEnabled: input.weeklyDigestEnabled,
          }),
          ...(input.complianceAlertsEnabled !== undefined && {
            complianceAlertsEnabled: input.complianceAlertsEnabled,
          }),
          ...(input.documentProcessedEnabled !== undefined && {
            documentProcessedEnabled: input.documentProcessedEnabled,
          }),
          ...(input.reminderThresholds !== undefined && {
            reminderThresholds: input.reminderThresholds,
          }),
          ...(input.digestFrequency !== undefined && {
            digestFrequency: input.digestFrequency,
          }),
        },
      });

      return preferences;
    }),

  // Get notification logs (for debugging/history)
  getNotificationLogs: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z.enum([
          'DEADLINE_REMINDER',
          'WEEKLY_DIGEST',
          'COMPLIANCE_ALERT',
          'DOCUMENT_PROCESSED',
          'CONFLICT_DETECTED',
          'COMMITMENT_DUE',
        ]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find the organization user record
      const orgUser = await ctx.db.organizationUser.findFirst({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const logs = await ctx.db.notificationLog.findMany({
        where: {
          userId: orgUser.id,
          ...(input.type && { type: input.type }),
        },
        orderBy: { sentAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.notificationLog.count({
        where: {
          userId: orgUser.id,
          ...(input.type && { type: input.type }),
        },
      });

      return {
        logs,
        total,
        hasMore: total > input.offset + input.limit,
      };
    }),

  // Test send a notification (for testing purposes)
  sendTestNotification: publicProcedure
    .input(
      z.object({
        type: z.enum(['DEADLINE_REMINDER', 'WEEKLY_DIGEST', 'COMPLIANCE_ALERT', 'DOCUMENT_PROCESSED']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find the organization user record
      const orgUser = await ctx.db.organizationUser.findFirst({
        where: { clerkUserId: ctx.auth.userId },
        include: { notificationPreferences: true },
      });

      if (!orgUser || !orgUser.notificationPreferences) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User or notification preferences not found',
        });
      }

      // Import Inngest client and trigger test notification
      const { inngest } = await import('../../inngest/client');

      await inngest.send({
        name: 'notification/test',
        data: {
          userId: orgUser.id,
          type: input.type,
          email: orgUser.notificationPreferences.email,
        },
      });

      return { success: true };
    }),

  // ============================================================================
  // IN-APP NOTIFICATIONS
  // ============================================================================

  // Get in-app notifications for current user
  getNotifications: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find the organization user record
      const orgUser = await ctx.db.organizationUser.findFirst({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const notifications = await ctx.db.notification.findMany({
        where: {
          organizationId: orgUser.organizationId,
          OR: [
            { userId: orgUser.id }, // User-specific notifications
            { userId: null }, // Org-wide notifications
          ],
          ...(input.unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.notification.count({
        where: {
          organizationId: orgUser.organizationId,
          OR: [
            { userId: orgUser.id },
            { userId: null },
          ],
          ...(input.unreadOnly && { isRead: false }),
        },
      });

      return {
        notifications,
        total,
        hasMore: total > input.offset + input.limit,
      };
    }),

  // Get unread notification count
  getUnreadCount: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Find the organization user record
    const orgUser = await ctx.db.organizationUser.findFirst({
      where: { clerkUserId: ctx.auth.userId },
    });

    if (!orgUser) {
      return { count: 0 };
    }

    const count = await ctx.db.notification.count({
      where: {
        organizationId: orgUser.organizationId,
        OR: [
          { userId: orgUser.id },
          { userId: null },
        ],
        isRead: false,
      },
    });

    return { count };
  }),

  // Mark a notification as read
  markAsRead: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find the organization user record
      const orgUser = await ctx.db.organizationUser.findFirst({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify the notification belongs to this user/org
      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.notificationId,
          organizationId: orgUser.organizationId,
          OR: [
            { userId: orgUser.id },
            { userId: null },
          ],
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      await ctx.db.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      });

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.auth.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Find the organization user record
    const orgUser = await ctx.db.organizationUser.findFirst({
      where: { clerkUserId: ctx.auth.userId },
    });

    if (!orgUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    await ctx.db.notification.updateMany({
      where: {
        organizationId: orgUser.organizationId,
        OR: [
          { userId: orgUser.id },
          { userId: null },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }),

  // Create a notification (for testing and background jobs)
  createNotification: publicProcedure
    .input(
      z.object({
        type: z.enum(['DEADLINE', 'OPPORTUNITY', 'TEAM', 'DOCUMENT', 'SYSTEM']),
        title: z.string(),
        message: z.string(),
        linkUrl: z.string().optional(),
        userId: z.string().optional(), // If not provided, it's org-wide
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find the organization user record
      const orgUser = await ctx.db.organizationUser.findFirst({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!orgUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const notification = await ctx.db.notification.create({
        data: {
          organizationId: orgUser.organizationId,
          userId: input.userId || null,
          type: input.type,
          title: input.title,
          message: input.message,
          linkUrl: input.linkUrl,
        },
      });

      return notification;
    }),
});
