import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import { ProcessingStatus } from '@prisma/client'

/**
 * Cleanup job that runs hourly to find and mark stuck documents as FAILED
 *
 * Handles documents stuck in:
 * - PENDING: File uploaded to S3 but confirmUpload never called (>2 hours)
 * - PROCESSING: Job started but never completed (>1 hour)
 */
export const cleanupStuckDocuments = inngest.createFunction(
  {
    id: 'cleanup-stuck-documents',
    name: 'Cleanup Stuck Documents',
    // Run every hour
  },
  { cron: '0 * * * *' }, // Every hour at minute 0
  async ({ step }) => {
    console.log('[CLEANUP] Starting stuck documents cleanup job')

    const results = await step.run('find-and-fix-stuck-documents', async () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)

      // Find documents stuck in PENDING for >2 hours
      const stuckPending = await db.document.findMany({
        where: {
          status: ProcessingStatus.PENDING,
          createdAt: {
            lt: twoHoursAgo
          }
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
          createdAt: true,
        }
      })

      console.log(`[CLEANUP] Found ${stuckPending.length} documents stuck in PENDING`)

      // Mark stuck PENDING documents as FAILED
      if (stuckPending.length > 0) {
        const pendingIds = stuckPending.map(d => d.id)

        await db.document.updateMany({
          where: {
            id: { in: pendingIds }
          },
          data: {
            status: ProcessingStatus.FAILED,
            parseWarnings: [
              'Document stuck in PENDING status for over 2 hours.',
              'File upload may have failed or confirmUpload was never called.',
              'Please try uploading the document again.',
              `Marked as failed by cleanup job at: ${now.toISOString()}`
            ],
            processedAt: now,
          }
        })

        console.log(`[CLEANUP] Marked ${stuckPending.length} PENDING documents as FAILED`)
      }

      // Find documents stuck in PROCESSING for >1 hour
      const stuckProcessing = await db.document.findMany({
        where: {
          status: ProcessingStatus.PROCESSING,
          updatedAt: {
            lt: oneHourAgo
          }
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
          updatedAt: true,
        }
      })

      console.log(`[CLEANUP] Found ${stuckProcessing.length} documents stuck in PROCESSING`)

      // Mark stuck PROCESSING documents as FAILED
      if (stuckProcessing.length > 0) {
        const processingIds = stuckProcessing.map(d => d.id)

        await db.document.updateMany({
          where: {
            id: { in: processingIds }
          },
          data: {
            status: ProcessingStatus.FAILED,
            parseWarnings: [
              'Document stuck in PROCESSING status for over 1 hour.',
              'Background job may have crashed or timed out.',
              'Please try reprocessing the document or contact support.',
              `Marked as failed by cleanup job at: ${now.toISOString()}`
            ],
            processedAt: now,
          }
        })

        console.log(`[CLEANUP] Marked ${stuckProcessing.length} PROCESSING documents as FAILED`)
      }

      return {
        stuckPending: stuckPending.length,
        stuckProcessing: stuckProcessing.length,
        totalFixed: stuckPending.length + stuckProcessing.length,
        timestamp: now.toISOString(),
      }
    })

    console.log(`[CLEANUP] Cleanup job completed: ${results.totalFixed} documents fixed`)

    return results
  }
)
