import { inngest } from './client';
import { db } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { render } from '@react-email/render';
import { WeeklyDigestEmail } from '@/lib/email-templates/weekly-digest';

/**
 * Scheduled function that runs every Monday at 8 AM to send weekly digests
 * Sends a summary of grant pipeline, upcoming deadlines, and recent activity
 */
export const sendWeeklyDigest = inngest.createFunction(
  {
    id: 'send-weekly-digest',
    name: 'Send Weekly Digest',
  },
  { cron: '0 8 * * 1' }, // Run every Monday at 8 AM UTC
  async ({ step }) => {
    const organizations = await step.run('fetch-organizations', async () => {
      // Get all onboarded organizations
      return await db.organization.findMany({
        where: {
          onboardingCompleted: true,
        },
        include: {
          users: {
            include: {
              notificationPreferences: true,
            },
          },
          grants: {
            include: {
              funder: true,
            },
          },
        },
      });
    });

    const digestsSent = await step.run('send-digests', async () => {
      let count = 0;
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const org of organizations) {
        // Calculate stats
        const totalGrants = org.grants.length;
        const totalAwarded = org.grants
          .filter((g) => g.status === 'AWARDED' || g.status === 'ACTIVE')
          .reduce((sum, g) => sum + Number(g.amountAwarded || 0), 0);

        const activeGrants = org.grants.filter(
          (g) => g.status === 'WRITING' || g.status === 'REVIEW' || g.status === 'SUBMITTED' || g.status === 'PENDING'
        ).length;

        const upcomingDeadlines = org.grants.filter(
          (g) => g.deadline && g.deadline >= now && g.deadline <= sevenDaysFromNow
        );

        const recentActivity = org.grants
          .filter((g) => g.updatedAt >= sevenDaysAgo)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 5);

        // Get week range for the digest
        const startOfWeek = new Date(sevenDaysAgo);
        const endOfWeek = new Date(now);
        const weekRange = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;

        // Send digest to each user
        for (const orgUser of org.users) {
          const prefs = orgUser.notificationPreferences;

          // Skip if user doesn't have digest enabled or frequency doesn't match
          if (!prefs || !prefs.weeklyDigestEnabled || prefs.digestFrequency === 'NONE') continue;

          // For daily digests, this function won't send (we'd need a separate daily function)
          // This only handles weekly digests
          if (prefs.digestFrequency === 'DAILY') continue;

          try {
            const emailHtml = render(
              WeeklyDigestEmail({
                userName: 'there', // Could fetch from Clerk if needed
                weekRange,
                stats: {
                  totalGrants,
                  totalAwarded,
                  activeGrants,
                  upcomingDeadlines: upcomingDeadlines.length,
                },
                upcomingDeadlines: upcomingDeadlines.slice(0, 5).map((g) => ({
                  id: g.id,
                  title: g.funder?.name || 'Grant',
                  funderName: g.funder?.name || 'Unknown',
                  status: g.status,
                  deadline: g.deadline?.toLocaleDateString(),
                })),
                recentActivity: recentActivity.map((g) => ({
                  id: g.id,
                  title: g.funder?.name || 'Grant',
                  funderName: g.funder?.name || 'Unknown',
                  status: g.status,
                  amount: g.amountAwarded ? Number(g.amountAwarded) : undefined,
                })),
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
              })
            );

            await resend.emails.send({
              from: FROM_EMAIL,
              to: prefs.email,
              subject: `Weekly Grant Digest - ${org.name}`,
              html: emailHtml,
            });

            // Log the notification
            await db.notificationLog.create({
              data: {
                userId: orgUser.id,
                type: 'WEEKLY_DIGEST',
                subject: `Weekly Grant Digest - ${org.name}`,
                metadata: { organizationId: org.id, weekRange },
                success: true,
              },
            });

            count++;
          } catch (error) {
            console.error(`Failed to send weekly digest to ${prefs.email}:`, error);

            // Log the failed notification
            await db.notificationLog.create({
              data: {
                userId: orgUser.id,
                type: 'WEEKLY_DIGEST',
                subject: `Weekly Grant Digest - ${org.name}`,
                metadata: { organizationId: org.id, weekRange },
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
      organizationsProcessed: organizations.length,
      digestsSent,
    };
  }
);
