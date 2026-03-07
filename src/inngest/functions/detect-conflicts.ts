import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import { detectConflicts } from '@/server/services/compliance/conflict-detector'

export const detectConflictsScheduled = inngest.createFunction(
  {
    id: 'detect-conflicts-scheduled',
    name: 'Detect Compliance Conflicts (Scheduled)',
  },
  { cron: '0 2 * * *' }, // 2 AM daily
  async ({ step }) => {
    // Get all organizations with completed onboarding
    const orgs = await db.organization.findMany({
      where: { onboardingCompleted: true },
      select: { id: true, name: true }
    })

    const results = []

    for (const org of orgs) {
      const result = await step.run(`detect-conflicts-${org.id}`, async () => {
        try {
          const conflicts = await detectConflicts(org.id)

          // Log audit trail
          await db.complianceAudit.create({
            data: {
              organizationId: org.id,
              actionType: 'SCAN_COMPLETED',
              description: `Scheduled conflict scan detected ${conflicts.length} conflicts`,
              performedBy: 'SYSTEM',
              metadata: { conflictCount: conflicts.length, scheduled: true }
            }
          })

          // Send compliance alerts for new HIGH/CRITICAL conflicts
          const criticalConflicts = conflicts.filter(
            (c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'
          )

          let alertsSent = 0

          if (criticalConflicts.length > 0) {
            // Get all org users with compliance alerts enabled
            const usersWithAlerts = await db.notificationPreferences.findMany({
              where: {
                complianceAlertsEnabled: true,
                user: {
                  organizationId: org.id,
                },
              },
              include: {
                user: true,
              },
            })

            // Find the DB conflict records that were just created by detectConflicts
            const recentConflicts = await db.commitmentConflict.findMany({
              where: {
                commitment: {
                  organizationId: org.id,
                },
                status: 'UNRESOLVED',
                severity: { in: ['HIGH', 'CRITICAL'] },
                createdAt: {
                  gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
                },
              },
              select: { id: true, severity: true },
            })

            // Send alerts for each new conflict to each subscribed user
            for (const conflict of recentConflicts) {
              for (const pref of usersWithAlerts) {
                await inngest.send({
                  name: 'notification/compliance-alert',
                  data: {
                    conflictId: conflict.id,
                    userId: pref.userId,
                    email: pref.email,
                    severity: conflict.severity,
                  },
                })
                alertsSent++
              }
            }

            // Also create in-app notifications
            for (const pref of usersWithAlerts) {
              await db.notification.create({
                data: {
                  organizationId: org.id,
                  userId: pref.userId,
                  type: 'SYSTEM',
                  title: `${criticalConflicts.length} compliance conflict${criticalConflicts.length > 1 ? 's' : ''} detected`,
                  message: `The nightly compliance scan found ${criticalConflicts.length} high or critical conflict${criticalConflicts.length > 1 ? 's' : ''} that require${criticalConflicts.length === 1 ? 's' : ''} your attention.`,
                  linkUrl: '/compliance',
                },
              })
            }
          }

          return {
            orgId: org.id,
            orgName: org.name,
            conflictCount: conflicts.length,
            alertsSent,
            success: true
          }
        } catch (error) {
          console.error(`Conflict detection failed for org ${org.id}:`, error)
          return {
            orgId: org.id,
            orgName: org.name,
            conflictCount: 0,
            alertsSent: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      results.push(result)
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalConflicts = results.reduce((sum, r) => sum + (r.conflictCount || 0), 0)
    const totalAlerts = results.reduce((sum, r) => sum + (r.alertsSent || 0), 0)

    return {
      processedOrgs: orgs.length,
      successful,
      failed,
      totalConflicts,
      totalAlerts,
      results
    }
  }
)
