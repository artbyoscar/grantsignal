import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { parseDocument } from '@/server/services/documents/parser'
import { ProcessingStatus } from '@prisma/client'
import { chunkText } from '@/server/services/documents/chunker'
import { generateEmbeddings } from '@/server/services/ai/embeddings'
import { getIndex, isPineconeConfigured } from '@/lib/pinecone'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

/**
 * Process uploaded document: download from S3, parse, and update database
 */
export const processDocument = inngest.createFunction(
  {
    id: 'process-document',
    name: 'Process Document',
    retries: 3,
  },
  { event: 'document/uploaded' },
  async ({ event, step }) => {
    const { documentId, organizationId, s3Key, mimeType } = event.data

    // Step 1: Download document from S3
    const buffer = await step.run('download-from-s3', async () => {
      console.log(`Downloading document ${documentId} from S3: ${s3Key}`)

      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: s3Key,
        })

        const response = await s3Client.send(command)

        if (!response.Body) {
          throw new Error('No body in S3 response')
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk)
        }

        return Buffer.concat(chunks)
      } catch (error) {
        console.error('S3 download failed:', error)
        throw new Error(
          `Failed to download document from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })

    // Step 2: Parse document
    const parseResult = await step.run('parse-document', async () => {
      console.log(`Parsing document ${documentId} (${mimeType})`)

      try {
        const result = await parseDocument(buffer, mimeType)
        console.log(
          `Document parsed: ${result.metadata.wordCount} words, ${result.confidence}% confidence`
        )
        return result
      } catch (error) {
        console.error('Document parsing failed:', error)
        throw error
      }
    })

    // Step 3: Update database with extracted text and confidence
    const documentData = await step.run('update-database', async () => {
      console.log(`Updating database for document ${documentId}`)

      try {
        // Determine final status based on confidence
        let status: ProcessingStatus
        if (parseResult.confidence >= 70) {
          status = ProcessingStatus.COMPLETED
        } else {
          status = ProcessingStatus.NEEDS_REVIEW
        }

        const updatedDoc = await db.document.update({
          where: {
            id: documentId,
            organizationId, // Security: ensure org ownership
          },
          data: {
            extractedText: parseResult.text,
            confidenceScore: Math.round(parseResult.confidence),
            parseWarnings: parseResult.warnings.length > 0 ? parseResult.warnings : null,
            metadata: parseResult.metadata,
            status,
            processedAt: new Date(),
          },
        })

        console.log(`Document ${documentId} updated with status: ${status}`)

        return {
          documentId,
          documentName: updatedDoc.name,
          status,
          confidence: parseResult.confidence,
          wordCount: parseResult.metadata.wordCount,
          warningsCount: parseResult.warnings.length,
        }
      } catch (error) {
        console.error('Database update failed:', error)

        // Mark as FAILED if database update fails
        await db.document
          .update({
            where: { id: documentId },
            data: {
              status: ProcessingStatus.FAILED,
              parseWarnings: [
                `Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              ],
            },
          })
          .catch(err => {
            console.error('Failed to mark document as FAILED:', err)
          })

        throw error
      }
    })

    // Step 4: Vectorize document and upload to Pinecone (if configured)
    await step.run('vectorize-document', async () => {
      // Skip vectorization if Pinecone is not configured
      if (!isPineconeConfigured()) {
        console.log('Pinecone not configured. Skipping vectorization.')
        return { skipped: true, reason: 'Pinecone not configured' }
      }

      // Skip vectorization if text is too short
      if (!parseResult.text || parseResult.text.length < 100) {
        console.log('Document text too short. Skipping vectorization.')
        return { skipped: true, reason: 'Text too short' }
      }

      try {
        console.log(`Chunking document ${documentId}`)
        const chunks = chunkText(parseResult.text)

        if (chunks.length === 0) {
          console.log('No chunks generated. Skipping vectorization.')
          return { skipped: true, reason: 'No chunks generated' }
        }

        console.log(`Generated ${chunks.length} chunks for document ${documentId}`)

        // Generate embeddings for all chunks
        console.log(`Generating embeddings for ${chunks.length} chunks`)
        const embeddings = await generateEmbeddings(chunks.map(chunk => chunk.text))

        console.log(`Generated ${embeddings.length} embeddings`)

        // Prepare vectors for Pinecone
        const vectors = chunks.map((chunk, index) => ({
          id: `${documentId}-${chunk.index}`,
          values: embeddings[index],
          metadata: {
            organizationId,
            documentId,
            documentName: documentData.documentName,
            documentType: mimeType,
            chunkIndex: chunk.index,
            text: chunk.text,
          },
        }))

        // Upload to Pinecone
        const index = getIndex()
        if (!index) {
          throw new Error('Failed to get Pinecone index')
        }

        console.log(`Upserting ${vectors.length} vectors to Pinecone`)
        await index.namespace(organizationId).upsert(vectors)

        console.log(`Successfully vectorized document ${documentId}`)

        // Store Pinecone IDs in database
        const pineconeIds = vectors.map(v => v.id)
        await db.document.update({
          where: { id: documentId },
          data: {
            metadata: {
              ...(parseResult.metadata as any),
              pineconeIds,
              vectorized: true,
              chunkCount: chunks.length,
            },
          },
        })

        return {
          success: true,
          chunkCount: chunks.length,
          vectorCount: vectors.length,
        }
      } catch (error) {
        console.error('Vectorization failed:', error)
        // Don't fail the entire job if vectorization fails
        // The document is still processed and searchable by name
        return {
          skipped: true,
          reason: 'Vectorization error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })

    return {
      success: true,
      documentId,
      status:
        parseResult.confidence >= 70
          ? ProcessingStatus.COMPLETED
          : ProcessingStatus.NEEDS_REVIEW,
      confidence: parseResult.confidence,
    }
  }
)