import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { calculateFitScore as calculateFitScoreService, getOrCalculateFitScore } from '../../lib/fit-scoring'
import type { FitScoreResult } from '../../lib/fit-scoring'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { inngest } from '@/inngest/client'

/**
 * Mock delay to simulate API processing
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
 * Discovery router for RFP parsing and fit scoring
 */
export const discoveryRouter = router({
  /**
   * Parse RFP from URL or text
   * TODO: Integrate with Claude API for real parsing
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
      // Simulate processing time
      await delay(2000)

      // Mock parsed RFP data
      const mockData = {
        title: input.url
          ? 'Community Development Block Grant'
          : 'Sample Grant Opportunity',
        description: 'This grant supports community development initiatives focused on improving infrastructure, housing, and economic opportunities in underserved areas. The program aims to create lasting impact through sustainable community partnerships.',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        amountMin: 50000,
        amountMax: 250000,
        requirements: [
          {
            section: 'Project Narrative',
            description: 'Describe your proposed project, goals, and expected outcomes',
            wordLimit: 1000,
          },
          {
            section: 'Organizational Capacity',
            description: 'Detail your organization\'s experience and capabilities',
            wordLimit: 500,
          },
          {
            section: 'Budget Justification',
            description: 'Provide detailed budget breakdown and justification',
            wordLimit: 750,
          },
          {
            section: 'Evaluation Plan',
            description: 'Explain how you will measure success and impact',
            wordLimit: 500,
          },
        ],
        eligibility: [
          'Must be a registered 501(c)(3) nonprofit organization',
          'Organization must have been operational for at least 2 years',
          'Project must serve communities with median income below 80% of area median',
          'Must demonstrate community partnership and support',
        ],
        confidence: 0.92, // Confidence score for parsing accuracy
        source: input.url || 'Direct text input',
      }

      return mockData
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
   * Triggers Inngest job to process the file and extract RFP details
   */
  parseRfpFile: orgProcedure
    .input(
      z.object({
        s3Key: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Trigger Inngest job to parse the RFP file
      await inngest.send({
        name: 'rfp/parse-file',
        data: {
          s3Key: input.s3Key,
          fileName: input.fileName,
          organizationId: ctx.organizationId,
        },
      })

      // For now, return a placeholder while processing
      // In production, this would be replaced by polling or webhooks
      return {
        status: 'processing',
        message: 'RFP file is being processed. This may take a few moments.',
      }
    }),
})
