import { inngest } from '@/inngest/client'
import { db } from '@/lib/prisma'
import { ProcessingStatus, DocumentType } from '@prisma/client'
import { analyzeOrganizationalVoice, calculateConfidence } from '@/server/services/ai/voice-analyzer'

/**
 * Analyzes organization's writing voice from completed documents
 * This is a long-running operation that processes multiple documents
 */
export const analyzeVoice = inngest.createFunction(
  {
    id: 'analyze-voice',
    name: 'Analyze Organization Voice',
    retries: 2,
  },
  { event: 'voice/analyze' },
  async ({ event, step }) => {
    const { organizationId, forceRefresh } = event.data

    // Step 1: Check if analysis needed
    const shouldAnalyze = await step.run('check-if-analysis-needed', async () => {
      if (forceRefresh) {
        console.log(`Force refresh requested for organization ${organizationId}`)
        return true
      }

      const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: {
          voiceProfile: true,
          voiceUpdatedAt: true,
        },
      })

      // If no profile exists, analyze
      if (!org?.voiceProfile) {
        console.log(`No voice profile found for organization ${organizationId}`)
        return true
      }

      // If profile is older than 30 days, consider re-analyzing
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      if (org.voiceUpdatedAt && org.voiceUpdatedAt < thirtyDaysAgo) {
        console.log(
          `Voice profile for organization ${organizationId} is older than 30 days, re-analyzing`
        )
        return true
      }

      console.log(`Voice profile for organization ${organizationId} is up to date`)
      return false
    })

    if (!shouldAnalyze) {
      return {
        skipped: true,
        reason: 'Voice profile is up to date',
      }
    }

    // Step 2: Fetch completed documents
    const documents = await step.run('fetch-documents', async () => {
      console.log(`Fetching documents for organization ${organizationId}`)

      const docs = await db.document.findMany({
        where: {
          organizationId,
          status: ProcessingStatus.COMPLETED,
          extractedText: { not: null },
          type: {
            in: [DocumentType.PROPOSAL, DocumentType.REPORT, DocumentType.LOI],
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          extractedText: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Analyze top 20 most recent documents
      })

      console.log(`Found ${docs.length} documents for organization ${organizationId}`)

      if (docs.length === 0) {
        throw new Error('No completed documents found for voice analysis')
      }

      return docs
    })

    // Step 3: Analyze voice using Claude
    const voiceProfile = await step.run('analyze-voice-with-claude', async () => {
      console.log(`Analyzing voice for organization ${organizationId} using ${documents.length} documents`)

      const documentSamples = documents
        .filter(doc => doc.extractedText && doc.extractedText.length > 100)
        .map(doc => ({
          text: doc.extractedText!,
          documentName: doc.name,
          type: doc.type,
        }))

      if (documentSamples.length === 0) {
        throw new Error('No valid document samples found for analysis')
      }

      try {
        const profile = await analyzeOrganizationalVoice(documentSamples)
        console.log(`Voice analysis completed for organization ${organizationId}`)
        return profile
      } catch (error) {
        console.error('Voice analysis failed:', error)
        throw error
      }
    })

    // Step 4: Calculate metadata
    const metadata = await step.run('calculate-metadata', async () => {
      const confidence = calculateConfidence(documents.length)

      return {
        documentsAnalyzed: documents.length,
        lastUpdated: new Date(),
        confidence,
        documentIds: documents.map(d => d.id),
      }
    })

    // Step 5: Save to database
    await step.run('save-voice-profile', async () => {
      console.log(`Saving voice profile for organization ${organizationId}`)

      await db.organization.update({
        where: { id: organizationId },
        data: {
          voiceProfile: {
            profile: voiceProfile,
            metadata,
          } as any,
          voiceUpdatedAt: new Date(),
        },
      })

      console.log(`Voice profile saved for organization ${organizationId}`)
    })

    return {
      success: true,
      organizationId,
      documentsAnalyzed: documents.length,
      confidence: metadata.confidence,
    }
  }
)
