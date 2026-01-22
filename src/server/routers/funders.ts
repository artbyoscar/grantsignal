import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { inngest } from '@/inngest/client'
import { TRPCError } from '@trpc/server'

/**
 * Funders router for managing funder data and 990 intelligence
 */
export const fundersRouter = router({
  /**
   * Get funder by ID with all related data
   */
  getById: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const funder = await ctx.db.funder.findUnique({
        where: { id: input.funderId },
        include: {
          pastGrantees: {
            orderBy: { year: 'desc' },
            take: 100,
          },
          opportunities: {
            where: { deadline: { gte: new Date() } },
            orderBy: { deadline: 'asc' },
            take: 10,
          },
          grants: {
            where: { organizationId: ctx.organizationId },
            orderBy: { createdAt: 'desc' },
            include: {
              program: true,
            },
          },
        },
      })

      if (!funder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Funder not found',
        })
      }

      return funder
    }),

  /**
   * Search funders by name, EIN, or location
   */
  search: orgProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const funders = await ctx.db.funder.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { ein: { contains: input.query, mode: 'insensitive' } },
            { city: { contains: input.query, mode: 'insensitive' } },
            { state: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
        orderBy: { totalGiving: 'desc' },
        include: {
          _count: {
            select: {
              pastGrantees: true,
              opportunities: true,
              grants: true,
            },
          },
        },
      })

      return funders
    }),

  /**
   * List all funders with pagination
   */
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z.enum([
          'PRIVATE_FOUNDATION',
          'COMMUNITY_FOUNDATION',
          'CORPORATE',
          'FEDERAL',
          'STATE',
          'LOCAL',
          'OTHER',
        ]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = input.type ? { type: input.type } : {}

      const [funders, total] = await Promise.all([
        ctx.db.funder.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { totalGiving: 'desc' },
          include: {
            _count: {
              select: {
                pastGrantees: true,
                opportunities: true,
              },
            },
          },
        }),
        ctx.db.funder.count({ where }),
      ])

      return {
        funders,
        total,
        hasMore: input.offset + input.limit < total,
      }
    }),

  /**
   * Create a new funder and optionally trigger 990 sync
   */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        ein: z.string().optional(),
        type: z.enum([
          'PRIVATE_FOUNDATION',
          'COMMUNITY_FOUNDATION',
          'CORPORATE',
          'FEDERAL',
          'STATE',
          'LOCAL',
          'OTHER',
        ]),
        website: z.string().url().optional(),
        mission: z.string().optional(),
        sync990: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sync990, ...funderData } = input

      // Create funder
      const funder = await ctx.db.funder.create({
        data: funderData,
      })

      // Trigger 990 sync if EIN provided and sync requested
      if (funder.ein && sync990) {
        await inngest.send({
          name: 'funder/sync-990',
          data: {
            funderId: funder.id,
            ein: funder.ein,
          },
        })
      }

      return funder
    }),

  /**
   * Update funder information
   */
  update: orgProcedure
    .input(
      z.object({
        funderId: z.string(),
        name: z.string().min(1).optional(),
        ein: z.string().optional(),
        mission: z.string().optional(),
        website: z.string().url().optional(),
        applicationProcess: z.string().optional(),
        applicationDeadline: z.string().optional(),
        contactInfo: z
          .object({
            email: z.string().email().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { funderId, ...updateData } = input

      const funder = await ctx.db.funder.update({
        where: { id: funderId },
        data: updateData,
      })

      return funder
    }),

  /**
   * Manually trigger 990 sync for a funder
   */
  sync990: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const funder = await ctx.db.funder.findUnique({
        where: { id: input.funderId },
        select: { id: true, ein: true, name: true },
      })

      if (!funder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Funder not found',
        })
      }

      if (!funder.ein) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Funder does not have an EIN',
        })
      }

      // Trigger sync
      await inngest.send({
        name: 'funder/sync-990',
        data: {
          funderId: funder.id,
          ein: funder.ein,
        },
      })

      return {
        success: true,
        message: `990 sync initiated for ${funder.name}`,
      }
    }),

  /**
   * Get peer intelligence - organizations like yours that received grants
   */
  getPeerIntelligence: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get current organization's details
      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { ein: true, mission: true },
      })

      // Get past grantees from this funder
      const pastGrantees = await ctx.db.pastGrantee.findMany({
        where: { funderId: input.funderId },
        orderBy: { year: 'desc' },
        take: 100,
      })

      if (pastGrantees.length === 0) {
        return {
          peers: [],
          averageGrant: null,
          totalGrants: 0,
          years: [],
        }
      }

      // Calculate statistics
      const amounts = pastGrantees.map(g => Number(g.amount))
      const averageGrant = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const years = [...new Set(pastGrantees.map(g => g.year))].sort((a, b) => b - a)

      // Group by recipient
      const recipientMap = new Map<string, typeof pastGrantees>()
      pastGrantees.forEach(grantee => {
        const key = grantee.recipientEin || grantee.recipientName
        const existing = recipientMap.get(key) || []
        recipientMap.set(key, [...existing, grantee])
      })

      // Format peer data
      const peers = Array.from(recipientMap.entries())
        .map(([key, grants]) => {
          const totalReceived = grants.reduce(
            (sum, g) => sum + Number(g.amount),
            0
          )
          const latestGrant = grants[0]

          return {
            recipientName: latestGrant.recipientName,
            recipientEin: latestGrant.recipientEin,
            totalReceived,
            grantCount: grants.length,
            latestYear: latestGrant.year,
            latestAmount: Number(latestGrant.amount),
            purposes: [...new Set(grants.map(g => g.purpose).filter(Boolean))],
          }
        })
        .sort((a, b) => b.totalReceived - a.totalReceived)
        .slice(0, 20)

      return {
        peers,
        averageGrant,
        totalGrants: pastGrantees.length,
        years,
      }
    }),

  /**
   * Get giving history trends for a funder
   */
  getGivingHistory: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const funder = await ctx.db.funder.findUnique({
        where: { id: input.funderId },
        select: {
          historicalData: true,
          totalAssets: true,
          totalGiving: true,
        },
      })

      if (!funder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Funder not found',
        })
      }

      // Parse historical data
      const historicalData = funder.historicalData as any
      const filings = historicalData?.filings || []

      return {
        currentAssets: funder.totalAssets,
        currentGiving: funder.totalGiving,
        filings: filings.map((filing: any) => ({
          year: filing.year,
          totalRevenue: filing.totalRevenue,
          totalAssets: filing.totalAssets,
          totalGiving: filing.totalGiving,
          pdfUrl: filing.pdfUrl,
        })),
      }
    }),
})
