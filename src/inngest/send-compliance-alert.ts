import { inngest } from './client';
import { db } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { render } from '@react-email/render';
import { ComplianceAlertEmail } from '@/lib/email-templates/compliance-alert';

/**
 * Event-driven function that sends compliance alerts
 * Triggered when conflicts are detected or commitments are due
 */
export const sendComplianceAlert = inngest.createFunction(
  {
    id: 'send-compliance-alert',
    name: 'Send Compliance Alert',
  },
  { event: 'notification/compliance-alert' },
  async ({ event, step }) => {
    const { conflictId, userId, email, severity } = event.data;

    const conflict = await step.run('fetch-conflict-details', async () => {
      return await db.commitmentConflict.findUnique({
        where: { id: conflictId },
        include: {
          commitment: {
            include: {
              grant: {
                include: {
                  funder: true,
                },
              },
            },
          },
        },
      });
    });

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    await step.run('send-email', async () => {
      try {
        const affectedGrants = conflict.affectedGrants
          .map((grantId) => {
            // Would need to fetch grant details if we want to show grant names
            // For now, just show the grant IDs
            return grantId;
          });

        const emailHtml = render(
          ComplianceAlertEmail({
            alertType: 'CONFLICT_DETECTED',
            severity: conflict.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            title: `${conflict.conflictType.replace(/_/g, ' ')} Detected`,
            description: conflict.description,
            affectedGrants,
            actionRequired: conflict.suggestedResolution || 'Please review this conflict in the compliance dashboard.',
            complianceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compliance`,
          })
        );

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `🚨 Compliance Alert: ${conflict.conflictType.replace(/_/g, ' ')}`,
          html: emailHtml,
        });

        // Log the notification
        await db.notificationLog.create({
          data: {
            userId,
            type: 'CONFLICT_DETECTED',
            subject: `Compliance Alert: ${conflict.conflictType.replace(/_/g, ' ')}`,
            metadata: { conflictId, severity: conflict.severity },
            success: true,
          },
        });

        return { success: true };
      } catch (error) {
        console.error(`Failed to send compliance alert to ${email}:`, error);

        // Log the failed notification
        await db.notificationLog.create({
          data: {
            userId,
            type: 'CONFLICT_DETECTED',
            subject: `Compliance Alert: ${conflict.conflictType.replace(/_/g, ' ')}`,
            metadata: { conflictId, severity: conflict.severity },
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    });

    return { conflictId, sent: true };
  }
);
