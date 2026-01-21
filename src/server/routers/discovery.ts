import { z } from 'zod'
import { router, orgProcedure } from '../trpc'

/**
 * Mock delay to simulate API processing
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
   * Calculate fit score for a parsed opportunity
   * TODO: Implement real fit scoring against organization's documents and history
   */
  calculateFitScore: orgProcedure
    .input(
      z.object({
        opportunityData: z.object({
          title: z.string(),
          description: z.string(),
          amountMin: z.number().optional(),
          amountMax: z.number().optional(),
          requirements: z.array(z.object({
            section: z.string(),
            description: z.string(),
            wordLimit: z.number(),
          })),
          eligibility: z.array(z.string()),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Simulate processing time
      await delay(1500)

      // Mock fit score calculation
      // TODO: Implement real scoring based on:
      // - Organization's mission alignment
      // - Past grant history
      // - Document repository analysis
      // - Capacity/budget fit

      const mockScore = {
        overallScore: 78, // 0-100
        missionScore: 85,
        capacityScore: 72,
        historicalScore: 76,
        estimatedHours: 40,
        strengths: [
          'Strong mission alignment with community development focus',
          'Organization has successfully completed similar grants',
          'Budget range matches organizational capacity',
        ],
        concerns: [
          'Timeline is tight - requires immediate action',
          'Budget justification section may require additional financial documentation',
        ],
        recommendations: [
          'Highlight your recent community partnership initiatives',
          'Emphasize your 5-year track record in infrastructure projects',
          'Prepare detailed budget documentation early',
        ],
      }

      return mockScore
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
})
