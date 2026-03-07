import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import { detectConflicts } from '@/server/services/compliance/conflict-detector'

/**
 * Event-driven conflict detection: triggers immediately when a document
 * finishes processing, instead of waiting for the 2 AM nightly cron.
 *
 * This closes the real-time compliance loop:
 * Upload award letter -> Parse -> Extract commitments -> Detect conflicts -> Alert
 */
export const detectConflictsOnUpload = inngest.createFunction(
  {
    id: 'detect-conflicts-on-upload',
    name: 'Detect Compliance Conflicts (On Document Upload)',
    retries: 2,
  },
  { event: 'compliance/detect-conflicts' },
  async ({ event, step }) => {
    const { organizationId, documentId, trigger } = event.data

    // Step 1: Run conflict detection for this organization
    const conflicts = await step.run('detect-conflicts', async () => {
      try {
        const detected = await detectConflicts(organizationId)

        // Log audit trail
        await db.complianceAudit.create({
          data: {
            organizationId,
            actionType: 'SCAN_COMPLETED',
            description: `Real-time conflict scan triggered by ${trigger} detected ${detected.length} conflicts (document: ${documentId})`,
            performedBy: 'SYSTEM',
            metadata: {
              conflictCount: detected.length,
              trigger,
              documentId,
              scheduled: false,
            },
          },
        })

        return detected
      } catch (error) {
        console.error(`[detect-conflicts-on-upload] Failed for org ${organizationId}:`, error)
        throw error
      }
    })

    // Step 2: Send alerts for HIGH/CRITICAL conflicts
    const alertResult = await step.run('send-conflict-alerts', async () => {
      const criticalConflicts = conflicts.filter(
        (c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'
      )

      if (criticalConflicts.length === 0) {
        return { alertsSent: 0, inAppCreated: 0 }
      }

      // Get users with compliance alerts enabled
      const usersWithAlerts = await db.notificationPreferences.findMany({
        where: {
          complianceAlertsEnabled: true,
          user: {
            organizationId,
          },
        },
        include: {
          user: true,
        },
      })

      if (usersWithAlerts.length === 0) {
        return { alertsSent: 0, inAppCreated: 0 }
      }

      // Find recently created conflict records (from the detection above)
      const recentConflicts = await db.commitmentConflict.findMany({
        where: {
          commitment: {
            organizationId,
          },
          status: 'UNRESOLVED',
          severity: { in: ['HIGH', 'CRITICAL'] },
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
        select: { id: true, severity: true },
      })

      let alertsSent = 0

      // Send email alerts via Inngest events
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

      // Create in-app notifications
      let inAppCreated = 0
      for (const pref of usersWithAlerts) {
        await db.notification.create({
          data: {
            organizationId,
            userId: pref.userId,
            type: 'SYSTEM',
            title: `${criticalConflicts.length} compliance conflict${criticalConflicts.length > 1 ? 's' : ''} detected`,
            message: `A newly processed document triggered a compliance scan that found ${criticalConflicts.length} high or critical conflict${criticalConflicts.length > 1 ? 's' : ''} requiring your attention.`,
            linkUrl: '/compliance',
          },
        })
        inAppCreated++
      }

      return { alertsSent, inAppCreated }
    })

    return {
      success: true,
      organizationId,
      documentId,
      trigger,
      conflictCount: conflicts.length,
      ...alertResult,
    }
  }
)
