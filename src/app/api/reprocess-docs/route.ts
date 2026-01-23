import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { inngest } from '@/inngest/client'
import { ProcessingStatus } from '@prisma/client'

/**
 * TEMPORARY ENDPOINT
 * POST /api/reprocess-docs
 *
 * Reprocesses all documents with PENDING status by sending them to Inngest.
 * This is a quick fix for documents that were uploaded when Inngest wasn't running.
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/reprocess-docs
 *
 * TODO: Remove this endpoint once all stuck documents are reprocessed
 */
export async function POST() {
  try {
    // Find all pending documents
    const pendingDocs = await db.document.findMany({
      where: { status: ProcessingStatus.PENDING }
    })

    console.log(`Found ${pendingDocs.length} pending documents to reprocess`)

    // Send each document to Inngest for processing
    const results = []
    for (const doc of pendingDocs) {
      try {
        // Update status to PROCESSING
        await db.document.update({
          where: { id: doc.id },
          data: { status: ProcessingStatus.PROCESSING }
        })

        // Send to Inngest
        await inngest.send({
          name: 'document/uploaded',
          data: {
            documentId: doc.id,
            organizationId: doc.organizationId,
            s3Key: doc.s3Key,
            mimeType: doc.mimeType,
          }
        })

        results.push({
          id: doc.id,
          name: doc.name,
          status: 'queued'
        })

        console.log(`Queued document ${doc.id} (${doc.name}) for processing`)
      } catch (error) {
        console.error(`Failed to reprocess document ${doc.id}:`, error)
        results.push({
          id: doc.id,
          name: doc.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      reprocessed: results.length,
      documents: results
    })
  } catch (error) {
    console.error('Error reprocessing documents:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
