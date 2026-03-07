import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { calculateFitScore as calculateFitScoreService, getOrCalculateFitScore } from '../../lib/fit-scoring'
import type { FitScoreResult } from '../../lib/fit-scoring'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { inngest } from '@/inngest/client'
import { anthropic } from '@/lib/anthropic'
import { parseDocument } from '@/server/services/documents/parser'
import { logActivity, ActivityActions } from '@/lib/activity-logger'

/**
 * S3 client for file uploads
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

/**
 * Use Claude to extract structured RFP data from raw text.
 * Returns parsed grant opportunity details.
 */
async function extractRfpWithClaude(text: string, source: string) {
  const prompt = `You are analyzing a grant opportunity document (RFP, FOA, NOFO, or similar). Extract structured information from the following text.

Return a JSON object with exactly these fields:
{
  "title": "The grant/opportunity title",
  "description": "A 2-3 sentence summary of what the grant funds",
  "deadline": "ISO 8601 date string if found, or null",
  "amountMin": number or null (minimum funding amount in USD),
  "amountMax": number or null (maximum funding amount in USD),
  "requirements": [
    {
      "section": "Section name (e.g. 'Project Narrative', 'Budget')",
      "description": "What this section requires",
      "wordLimit": number or 0 if not specified
    }
  ],
  "eligibility": ["eligibility criterion 1", "eligibility criterion 2"],
  "confidence": number between 0 and 1 representing how confident you are in the extraction
}

Important:
- If the text does not appear to be a grant document, still extract what you can and set confidence low (below 0.5).
- For amounts, extract numbers without currency symbols.
- For deadlines, look for submission dates, due dates, closing dates.
- Include all major application sections in requirements.
- Be thorough with eligibility criteria.

Document text:
${text.substring(0, 50000)}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.text
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    return {
      title: parsed.title || 'Untitled Opportunity',
      description: parsed.description || text.substring(0, 300),
      deadline: parsed.deadline ? new Date(parsed.deadline) : undefined,
      amountMin: typeof parsed.amountMin === 'number' ? parsed.amountMin : undefined,
      amountMax: typeof parsed.amountMax === 'number' ? parsed.amountMax : undefined,
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      eligibility: Array.isArray(parsed.eligibility) ? parsed.eligibility : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      source,
    }
  } catch (error) {
    console.error('Claude RFP extraction failed:', error)
    // Fallback: return basic extraction from text
    return {
      title: text.substring(0, 100).split('\n')[0] || 'Untitled Opportunity',
      description: text.substring(0, 500),
      deadline: undefined,
      amountMin: undefined,
      amountMax: undefined,
      requirements: [],
      eligibility: [],
      confidence: 0.3,
      source,
    }
  }
}

/**
 * Discovery router for RFP parsing and fit scoring
 */
export const discoveryRouter = router({
  /**
   * Parse RFP from URL or pasted text using Claude AI
   */
  parseRfp: orgProcedure
    .input(
      z.object({
        url: z.string().url().optional(),
        text: z.string().optional(),
      }).refine(
        (data) => data.url || data.text,
        { message: 'Either URL or text must be provided' }
      )
    )
    .mutation(async ({ ctx, input }) => {
      const source = input.url || 'Direct text input'
      const text = input.text || ''

      // If URL provided, we would fetch content here in the future
      // For now, URL-based parsing requires the user to paste the text
      if (!text && input.url) {
        return {
          title: 'URL-based RFP',
          description: 'URL fetching is not yet supported. Please copy and paste the RFP text directly.',
          deadline: undefined,
          amountMin: undefined,
          amountMax: undefined,
          requirements: [],
          eligibility: [],
          confidence: 0.1,
          source,
        }
      }

      const result = await extractRfpWithClaude(text, source)

      logActivity({
        organizationId: ctx.organizationId,
        userId: ctx.auth.userId,
        action: ActivityActions.RFP_PARSED,
        entityType: 'opportunity',
        description: `Parsed RFP: "${result.title || 'Untitled'}" (${Math.round(result.confidence * 100)}% confidence)`,
        metadata: { source, confidence: result.confidence },
      })

      return result
    }),

  /**
   * Calculate fit score for an existing opportunity
   * Uses AI to analyze fit against organization's profile, documents, and history
   */
  calculateFitScore: orgProcedure
    .input(
      z.object({
        opportunityId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await calculateFitScoreService(
        input.opportunityId,
        ctx.organizationId
      )

      // Store in database
      await ctx.db.fitScore.upsert({
        where: {
          opportunityId_organizationId: {
            opportunityId: input.opportunityId,
            organizationId: ctx.organizationId,
          },
        },
        create: {
          opportunityId: input.opportunityId,
          organizationId: ctx.organizationId,
          overallScore: result.overallScore,
          missionScore: result.missionScore,
          capacityScore: result.capacityScore,
          geographicScore: result.geographicScore,
          historyScore: result.historyScore,
          estimatedHours: result.estimatedHours,
          reusableContent: result.reusableContent,
        },
        update: {
          overallScore: result.overallScore,
          missionScore: result.missionScore,
          capacityScore: result.capacityScore,
          geographicScore: result.geographicScore,
          historyScore: result.historyScore,
          estimatedHours: result.estimatedHours,
          reusableContent: result.reusableContent,
        },
      })

      return result
    }),

  /**
   * Get fit score for an opportunity (from cache or calculate new)
   * Returns cached score if exists, otherwise triggers new calculation
   */
  getFitScore: orgProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        forceRecalculate: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.forceRecalculate) {
        return await calculateFitScoreService(
          input.opportunityId,
          ctx.organizationId
        )
      }

      return await getOrCalculateFitScore(
        input.opportunityId,
        ctx.organizationId
      )
    }),

  /**
   * Calculate fit scores for multiple opportunities in batch
   * Useful for discovery page to show scores for all opportunities
   */
  batchCalculateFitScores: orgProcedure
    .input(
      z.object({
        opportunityIds: z.array(z.string()).max(50), // Limit to prevent overload
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.opportunityIds.map(async (opportunityId) => {
          try {
            // Use cached scores if available
            const score = await getOrCalculateFitScore(
              opportunityId,
              ctx.organizationId
            )
            return {
              opportunityId,
              overallScore: score.overallScore,
              estimatedHours: score.estimatedHours,
              fromCache: score.fromCache,
            }
          } catch (error) {
            console.error(`Failed to calculate fit score for ${opportunityId}:`, error)
            return {
              opportunityId,
              overallScore: 0,
              estimatedHours: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        })
      )

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        }
        return {
          opportunityId: input.opportunityIds[index],
          overallScore: 0,
          estimatedHours: 0,
          error: result.reason?.message || 'Failed to calculate',
        }
      })
    }),

  /**
   * Get recommended opportunities based on fit score
   * Returns opportunities with high fit scores for dashboard widgets
   */
  getRecommendedOpportunities: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        minScore: z.number().min(0).max(100).optional().default(70),
        includeDeadlinePassed: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()

      // Find all fit scores for this organization above the threshold
      const fitScores = await ctx.db.fitScore.findMany({
        where: {
          organizationId: ctx.organizationId,
          overallScore: {
            gte: input.minScore,
          },
          opportunity: input.includeDeadlinePassed
            ? undefined
            : {
                OR: [
                  { deadline: { gte: now } },
                  { deadline: null },
                ],
              },
        },
        orderBy: {
          overallScore: 'desc',
        },
        take: input.limit,
        include: {
          opportunity: {
            include: {
              funder: true,
            },
          },
        },
      })

      return fitScores.map(score => ({
        opportunity: score.opportunity,
        fitScore: {
          overallScore: score.overallScore,
          missionScore: score.missionScore,
          capacityScore: score.capacityScore,
          geographicScore: score.geographicScore,
          historyScore: score.historyScore,
          estimatedHours: score.estimatedHours,
          reusableContent: score.reusableContent as FitScoreResult['reusableContent'],
        },
      }))
    }),

  /**
   * List all opportunities with their fit scores
   * Supports sorting and filtering
   */
  listOpportunities: orgProcedure
    .input(
      z.object({
        sortBy: z.enum(['deadline', 'fitScore', 'createdAt']).optional().default('deadline'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
        minFitScore: z.number().min(0).max(100).optional(),
        includeDeadlinePassed: z.boolean().optional().default(false),
        search: z.string().optional(),
        funderTypes: z.array(z.enum(['PRIVATE_FOUNDATION', 'COMMUNITY_FOUNDATION', 'CORPORATE', 'FEDERAL', 'STATE'])).optional(),
        amountMin: z.number().optional(),
        amountMax: z.number().optional(),
        deadlineFrom: z.date().optional(),
        deadlineTo: z.date().optional(),
        programAreas: z.array(z.string()).optional(),
        states: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()

      // Build where clause
      const where: any = {
        fitScores: {
          some: {
            organizationId: ctx.organizationId,
            ...(input.minFitScore !== undefined && {
              overallScore: { gte: input.minFitScore },
            }),
          },
        },
      }

      // Filter by deadline if needed
      if (!input.includeDeadlinePassed) {
        where.OR = [
          { deadline: { gte: now } },
          { deadline: null },
        ]
      }

      // Filter by deadline range
      if (input.deadlineFrom || input.deadlineTo) {
        where.AND = where.AND || []
        if (input.deadlineFrom) {
          where.AND.push({ deadline: { gte: input.deadlineFrom } })
        }
        if (input.deadlineTo) {
          where.AND.push({ deadline: { lte: input.deadlineTo } })
        }
      }

      // Filter by amount range
      if (input.amountMin !== undefined || input.amountMax !== undefined) {
        where.AND = where.AND || []
        if (input.amountMin !== undefined) {
          where.AND.push({
            OR: [
              { amountMax: { gte: input.amountMin } },
              { amountMin: { gte: input.amountMin } },
            ],
          })
        }
        if (input.amountMax !== undefined) {
          where.AND.push({
            OR: [
              { amountMin: { lte: input.amountMax } },
              { amountMax: { lte: input.amountMax } },
            ],
          })
        }
      }

      // Filter by funder type
      if (input.funderTypes && input.funderTypes.length > 0) {
        where.funder = {
          type: { in: input.funderTypes },
        }
      }

      // Filter by geographic focus (states)
      if (input.states && input.states.length > 0) {
        where.funder = {
          ...where.funder,
          state: { in: input.states },
        }
      }

      // Search filter
      if (input.search) {
        where.AND = where.AND || []
        where.AND.push({
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
            { funder: { name: { contains: input.search, mode: 'insensitive' } } },
          ],
        })
      }

      // Fetch opportunities with fit scores
      const opportunities = await ctx.db.opportunity.findMany({
        where,
        include: {
          funder: true,
          fitScores: {
            where: { organizationId: ctx.organizationId },
          },
        },
        orderBy:
          input.sortBy === 'fitScore'
            ? undefined // We'll sort by fitScore in memory
            : input.sortBy === 'deadline'
            ? { deadline: input.sortOrder }
            : { createdAt: input.sortOrder },
      })

      // Filter by program areas (client-side since it's JSON)
      let filteredOpportunities = opportunities
      if (input.programAreas && input.programAreas.length > 0) {
        filteredOpportunities = opportunities.filter((opp) => {
          if (!opp.funder?.programAreas) return false
          const funderAreas = Array.isArray(opp.funder.programAreas)
            ? opp.funder.programAreas
            : []
          return input.programAreas!.some((area) => funderAreas.includes(area))
        })
      }

      // If sorting by fit score, do it in memory
      if (input.sortBy === 'fitScore') {
        filteredOpportunities.sort((a, b) => {
          const scoreA = a.fitScores[0]?.overallScore ?? 0
          const scoreB = b.fitScores[0]?.overallScore ?? 0
          return input.sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA
        })
      }

      // Transform to include fit score data
      return filteredOpportunities.map((opp) => ({
        ...opp,
        fitScore: opp.fitScores[0]
          ? {
              overallScore: opp.fitScores[0].overallScore,
              missionScore: opp.fitScores[0].missionScore,
              capacityScore: opp.fitScores[0].capacityScore,
              geographicScore: opp.fitScores[0].geographicScore,
              historyScore: opp.fitScores[0].historyScore,
              estimatedHours: opp.fitScores[0].estimatedHours,
              reusableContent: opp.fitScores[0].reusableContent as FitScoreResult['reusableContent'],
            }
          : null,
        fitScores: undefined, // Remove the array
      }))
    }),

  /**
   * Save parsed opportunity to pipeline as a grant
   */
  saveOpportunity: orgProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        deadline: z.date().optional(),
        amountMin: z.number().optional(),
        amountMax: z.number().optional(),
        source: z.string(),
        fitScore: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { title, description, deadline, amountMin, amountMax, source, fitScore, notes } = input

      // Create a new opportunity record
      const opportunity = await ctx.db.opportunity.create({
        data: {
          title,
          description,
          deadline,
          amountMin,
          amountMax,
          source: 'USER_INGESTED',
          sourceUrl: source,
        },
      })

      // Create a grant in PROSPECT status linked to this opportunity
      const grant = await ctx.db.grant.create({
        data: {
          opportunityId: opportunity.id,
          organizationId: ctx.organizationId,
          status: 'PROSPECT',
          amountRequested: amountMax || amountMin,
          deadline,
          notes: notes || `AI Fit Score: ${fitScore || 0}/100\n\n${description}`,
        },
        include: {
          opportunity: true,
          funder: true,
          program: true,
        },
      })

      logActivity({
        organizationId: ctx.organizationId,
        userId: ctx.auth.userId,
        action: ActivityActions.OPPORTUNITY_SAVED,
        entityType: 'grant',
        entityId: grant.id,
        description: `Saved opportunity "${title}" to pipeline`,
        metadata: { fitScore, source, opportunityId: opportunity.id },
      })

      return {
        opportunity,
        grant,
      }
    }),

  /**
   * Generate presigned S3 URL for RFP file upload
   */
  createRfpUploadUrl: orgProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique S3 key
      const timestamp = Date.now()
      const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const s3Key = `rfps/${ctx.organizationId}/${timestamp}-${sanitizedFileName}`

      // Generate presigned URL for upload
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
        ContentType: input.fileType,
      })

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
      })

      return {
        uploadId: `${timestamp}-${sanitizedFileName}`,
        uploadUrl,
        s3Key,
      }
    }),

  /**
   * Parse RFP from uploaded file
   * Downloads from S3, extracts text, and uses Claude to parse RFP details.
   * Runs synchronously so the frontend gets immediate results.
   */
  parseRfpFile: orgProcedure
    .input(
      z.object({
        s3Key: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Step 1: Download file from S3
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: input.s3Key,
      })

      const response = await s3Client.send(command)

      if (!response.Body) {
        throw new Error('Failed to download file from storage')
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      // Step 2: Parse document to extract text
      const extension = input.fileName.split('.').pop()?.toLowerCase()
      let mimeType = 'application/pdf'
      if (extension === 'docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (extension === 'doc') {
        mimeType = 'application/msword'
      }

      const parseResult = await parseDocument(buffer, mimeType)

      if (!parseResult.text || parseResult.text.trim().length < 50) {
        throw new Error('Could not extract sufficient text from the document. The file may be scanned or image-based.')
      }

      // Step 3: Use Claude to extract structured RFP data
      const rfpData = await extractRfpWithClaude(parseResult.text, `File: ${input.fileName}`)

      return rfpData
    }),
})
