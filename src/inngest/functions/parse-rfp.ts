import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { parseDocument } from '@/server/services/documents/parser'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

/**
 * Parse RFP file: download from S3, extract grant details
 *
 * This function processes uploaded RFP files and extracts:
 * - Grant title and description
 * - Deadline information
 * - Funding amounts
 * - Requirements and sections
 * - Eligibility criteria
 */
export const parseRfp = inngest.createFunction(
  {
    id: 'parse-rfp',
    name: 'Parse RFP File',
    retries: 2,
  },
  { event: 'rfp/parse-file' },
  async ({ event, step }) => {
    const { s3Key, fileName, organizationId } = event.data

    // Step 1: Download RFP file from S3
    const buffer = await step.run('download-from-s3', async () => {
      console.log(`Downloading RFP file from S3: ${s3Key}`)

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
          `Failed to download RFP from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })

    // Step 2: Parse document to extract text
    const parseResult = await step.run('parse-rfp-document', async () => {
      console.log(`Parsing RFP file: ${fileName}`)

      try {
        // Detect MIME type from file extension
        const extension = fileName.split('.').pop()?.toLowerCase()
        let mimeType = 'application/pdf'

        if (extension === 'docx') {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else if (extension === 'doc') {
          mimeType = 'application/msword'
        }

        // Convert buffer if needed
        const actualBuffer = Buffer.isBuffer(buffer)
          ? buffer
          : Buffer.from((buffer as any).data || buffer)

        const result = await parseDocument(actualBuffer, mimeType)
        console.log(
          `RFP parsed: ${result.metadata.wordCount} words, ${result.confidence}% confidence`
        )
        return result
      } catch (error) {
        console.error('RFP parsing failed:', error)
        throw error
      }
    })

    // Step 3: Extract RFP details using AI
    // TODO: This is a placeholder for AI-powered extraction
    // In production, this would call Claude API to extract structured data
    const rfpDetails = await step.run('extract-rfp-details', async () => {
      console.log(`Extracting structured data from RFP: ${fileName}`)

      // For now, return mock data
      // In production, this would call Claude API with the extracted text
      // and prompt it to extract: title, description, deadline, amounts, requirements, eligibility

      return {
        title: `Grant from ${fileName}`,
        description: parseResult.text.substring(0, 500) + '...',
        deadline: null,
        amountMin: null,
        amountMax: null,
        requirements: [],
        eligibility: [],
        confidence: parseResult.confidence,
        source: `File: ${fileName}`,
        extractedText: parseResult.text,
      }
    })

    // Step 4: Store in database as opportunity
    const opportunity = await step.run('store-opportunity', async () => {
      console.log(`Creating opportunity from RFP: ${fileName}`)

      try {
        const opp = await db.opportunity.create({
          data: {
            title: rfpDetails.title,
            description: rfpDetails.description,
            deadline: rfpDetails.deadline,
            amountMin: rfpDetails.amountMin,
            amountMax: rfpDetails.amountMax,
            source: 'USER_INGESTED',
            sourceUrl: rfpDetails.source,
          },
        })

        console.log(`Opportunity created: ${opp.id}`)
        return opp
      } catch (error) {
        console.error('Failed to create opportunity:', error)
        throw error
      }
    })

    return {
      success: true,
      opportunityId: opportunity.id,
      title: rfpDetails.title,
      confidence: rfpDetails.confidence,
    }
  }
)
