import { inngest } from './client';
import { db } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { render } from '@react-email/render';
import { DeadlineReminderEmail } from '@/lib/email-templates/deadline-reminder';

/**
 * Scheduled function that runs daily at 8 AM to send deadline reminders
 * Checks all grants with upcoming deadlines and sends reminders based on user preferences
 */
export const sendDeadlineReminders = inngest.createFunction(
  {
    id: 'send-deadline-reminders',
    name: 'Send Deadline Reminders',
  },
  { cron: '0 8 * * *' }, // Run daily at 8 AM UTC
  async ({ step }) => {
    const result = await step.run('find-upcoming-deadlines', async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Find all grants with deadlines in the next 30 days
      const upcomingGrants = await db.grant.findMany({
        where: {
          deadline: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
          status: {
            in: ['PROSPECT', 'RESEARCHING', 'WRITING', 'REVIEW', 'SUBMITTED', 'PENDING'],
          },
        },
        include: {
          funder: true,
          organization: {
            include: {
              users: {
                include: {
                  notificationPreferences: true,
                },
              },
            },
          },
        },
      });

      return upcomingGrants;
    });

    // Process each grant and send reminders
    const remindersSent = await step.run('send-reminders', async () => {
      let count = 0;

      for (const grant of result) {
        if (!grant.deadline) continue;

        const daysUntilDeadline = Math.ceil(
          (grant.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // For each user in the organization
        for (const orgUser of grant.organization.users) {
          const prefs = orgUser.notificationPreferences;

          // Skip if user has deadline reminders disabled
          if (!prefs || !prefs.deadlineRemindersEnabled) continue;

          // Check if we should send a reminder for this deadline
          if (!prefs.reminderThresholds.includes(daysUntilDeadline)) continue;

          try {
            const emailHtml = render(
              DeadlineReminderEmail({
                grantTitle: grant.funder?.name || 'Grant',
                funderName: grant.funder?.name || 'Unknown Funder',
                deadline: grant.deadline.toLocaleDateString(),
                daysUntilDeadline,
                grantStatus: grant.status,
                grantUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pipeline`,
              })
            );

            await resend.emails.send({
              from: FROM_EMAIL,
              to: prefs.email,
              subject: `Deadline Reminder: ${grant.funder?.name || 'Grant'} (${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''} left)`,
              html: emailHtml,
            });

            // Log the notification
            await db.notificationLog.create({
              data: {
                userId: orgUser.id,
                type: 'DEADLINE_REMINDER',
                subject: `Deadline Reminder: ${grant.funder?.name || 'Grant'}`,
                metadata: { grantId: grant.id, daysUntilDeadline },
                success: true,
              },
            });

            count++;
          } catch (error) {
            console.error(`Failed to send deadline reminder to ${prefs.email}:`, error);

            // Log the failed notification
            await db.notificationLog.create({
              data: {
                userId: orgUser.id,
                type: 'DEADLINE_REMINDER',
                subject: `Deadline Reminder: ${grant.funder?.name || 'Grant'}`,
                metadata: { grantId: grant.id, daysUntilDeadline },
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              },
            });
          }
        }
      }

      return count;
    });

    return {
      grantsChecked: result.length,
      remindersSent,
    };
  }
);
