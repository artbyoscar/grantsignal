import { inngest } from './client';
import { db } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';

/**
 * Event-driven function that sends test notifications
 * Triggered from the notification settings page when a user clicks "Send Test"
 *
 * Routes to the appropriate notification type to verify email delivery is working.
 */
export const sendTestNotification = inngest.createFunction(
  {
    id: 'send-test-notification',
    name: 'Send Test Notification',
  },
  { event: 'notification/test' },
  async ({ event, step }) => {
    const { userId, type, email } = event.data;

    await step.run('send-test-email', async () => {
      const subjectByType: Record<string, string> = {
        DEADLINE_REMINDER: 'Test: Deadline Reminder',
        WEEKLY_DIGEST: 'Test: Weekly Digest',
        COMPLIANCE_ALERT: 'Test: Compliance Alert',
        DOCUMENT_PROCESSED: 'Test: Document Processed',
      };

      const subject = subjectByType[type] || 'Test Notification';

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `${subject} - GrantSignal`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 32px; color: #e2e8f0;">
                <h1 style="color: #38bdf8; font-size: 24px; margin: 0 0 16px 0;">Test Notification</h1>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  This is a test <strong>${type.replace(/_/g, ' ').toLowerCase()}</strong> notification from GrantSignal.
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
                  If you received this email, your notification settings are configured correctly.
                </p>
                <div style="border-top: 1px solid #334155; padding-top: 16px; margin-top: 16px;">
                  <p style="font-size: 12px; color: #64748b; margin: 0;">
                    Sent by GrantSignal | <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #38bdf8; text-decoration: none;">Manage notification preferences</a>
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        // Log the test notification
        await db.notificationLog.create({
          data: {
            userId,
            type: type as any,
            subject,
            metadata: { test: true, type },
            success: true,
          },
        });

        return { success: true };
      } catch (error) {
        console.error(`Failed to send test notification to ${email}:`, error);

        await db.notificationLog.create({
          data: {
            userId,
            type: type as any,
            subject,
            metadata: { test: true, type },
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    });

    return { userId, type, sent: true };
  }
);
