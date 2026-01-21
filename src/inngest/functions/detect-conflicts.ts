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

    console.log(`Running scheduled conflict detection for ${orgs.length} organizations`)

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

          return {
            orgId: org.id,
            orgName: org.name,
            conflictCount: conflicts.length,
            success: true
          }
        } catch (error) {
          console.error(`Conflict detection failed for org ${org.id}:`, error)
          return {
            orgId: org.id,
            orgName: org.name,
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

    console.log(`Scheduled conflict detection complete: ${successful} successful, ${failed} failed, ${totalConflicts} total conflicts`)

    return {
      processedOrgs: orgs.length,
      successful,
      failed,
      totalConflicts,
      results
    }
  }
)
