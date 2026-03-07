import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { inngest } from '@/inngest/client'
import { TRPCError } from '@trpc/server'
import { logActivity, ActivityActions } from '@/lib/activity-logger'

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

      logActivity({
        organizationId: ctx.organizationId,
        userId: ctx.auth.userId,
        action: ActivityActions.FUNDER_CREATED,
        entityType: 'funder',
        entityId: funder.id,
        description: `Added funder "${funder.name}"${sync990 && funder.ein ? ' with 990 sync' : ''}`,
        metadata: { type: funder.type, ein: funder.ein },
      })

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

  /**
   * Get full funder intelligence profile with AI-powered alignment scoring
   * Combines giving history, peer analysis, program alignment, and strategic recommendations
   */
  getIntelligenceProfile: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [funder, org] = await Promise.all([
        ctx.db.funder.findUnique({
          where: { id: input.funderId },
          include: {
            pastGrantees: {
              orderBy: { year: 'desc' },
              take: 200,
            },
            opportunities: {
              where: { deadline: { gte: new Date() } },
              orderBy: { deadline: 'asc' },
              take: 10,
            },
            grants: {
              where: { organizationId: ctx.organizationId },
              orderBy: { createdAt: 'desc' },
              include: { program: true },
            },
            requirements: {
              where: { organizationId: ctx.organizationId },
            },
          },
        }),
        ctx.db.organization.findUnique({
          where: { id: ctx.organizationId },
          select: {
            name: true,
            mission: true,
            primaryProgramAreas: true,
            voiceProfile: true,
            ein: true,
          },
        }),
      ])

      if (!funder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Funder not found' })
      }

      // --- Giving Trend Analysis ---
      const grantsByYear = new Map<number, { count: number; total: number }>()
      for (const g of funder.pastGrantees) {
        const entry = grantsByYear.get(g.year) || { count: 0, total: 0 }
        entry.count++
        entry.total += Number(g.amount)
        grantsByYear.set(g.year, entry)
      }

      const givingTrend = Array.from(grantsByYear.entries())
        .map(([year, data]) => ({
          year,
          grantCount: data.count,
          totalGiving: data.total,
          averageGrant: data.count > 0 ? Math.round(data.total / data.count) : 0,
        }))
        .sort((a, b) => a.year - b.year)

      // Calculate year-over-year growth
      const recentYears = givingTrend.slice(-3)
      let givingGrowthRate: number | null = null
      if (recentYears.length >= 2) {
        const oldest = recentYears[0].totalGiving
        const newest = recentYears[recentYears.length - 1].totalGiving
        givingGrowthRate = oldest > 0
          ? Math.round(((newest - oldest) / oldest) * 100)
          : null
      }

      // --- Program Area Alignment ---
      const funderAreas = ((funder.programAreas as any)?.areas || []) as string[]
      const orgAreas = (org?.primaryProgramAreas || []) as string[]

      const overlappingAreas = funderAreas.filter(fa =>
        orgAreas.some(oa =>
          oa.toLowerCase().includes(fa.toLowerCase()) ||
          fa.toLowerCase().includes(oa.toLowerCase())
        )
      )

      const programAlignmentScore = funderAreas.length > 0
        ? Math.round((overlappingAreas.length / funderAreas.length) * 100)
        : 0

      // --- Geographic Alignment ---
      const geoFocus = funder.geographicFocus as any
      const hasGeoAlignment = !!geoFocus // Simplified: would compare org location to funder focus

      // --- Grant Size Fit ---
      const amounts = funder.pastGrantees.map(g => Number(g.amount)).filter(a => a > 0)
      const grantSizeStats = amounts.length > 0 ? {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        median: amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)],
        average: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
        p25: amounts[Math.floor(amounts.length * 0.25)] || 0,
        p75: amounts[Math.floor(amounts.length * 0.75)] || 0,
      } : null

      // --- Purpose Analysis ---
      const purposeCounts = new Map<string, number>()
      for (const g of funder.pastGrantees) {
        if (g.purpose) {
          // Extract key phrases (simple word frequency)
          const words = g.purpose.toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
          for (const word of words) {
            purposeCounts.set(word, (purposeCounts.get(word) || 0) + 1)
          }
        }
      }
      const topPurposeKeywords = Array.from(purposeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word, count]) => ({ word, count }))

      // --- Relationship History ---
      const relationship = {
        totalGrantsReceived: funder.grants.length,
        totalFunding: funder.grants.reduce((sum, g) =>
          sum + (g.amountRequested ? Number(g.amountRequested) : 0), 0
        ),
        latestGrant: funder.grants[0] || null,
        activeGrants: funder.grants.filter(g =>
          ['WRITING', 'REVIEW', 'SUBMITTED', 'PENDING', 'AWARDED', 'ACTIVE'].includes(g.status)
        ).length,
        requirementsMet: funder.requirements.filter(r => r.value === 'met').length,
        requirementsTotal: funder.requirements.length,
      }

      // --- Overall Alignment Score ---
      let alignmentScore = 0
      let alignmentFactors: Array<{ factor: string; score: number; maxScore: number; description: string }> = []

      // Program alignment (0-30 points)
      const progPoints = Math.round(programAlignmentScore * 0.3)
      alignmentFactors.push({
        factor: 'Program Alignment',
        score: progPoints,
        maxScore: 30,
        description: overlappingAreas.length > 0
          ? `${overlappingAreas.length} overlapping focus areas: ${overlappingAreas.join(', ')}`
          : 'No direct overlap in stated program areas',
      })
      alignmentScore += progPoints

      // Giving capacity (0-20 points)
      const givingCapacityPoints = funder.totalGiving
        ? (Number(funder.totalGiving) > 1000000 ? 20 : Number(funder.totalGiving) > 100000 ? 15 : 10)
        : 0
      alignmentFactors.push({
        factor: 'Giving Capacity',
        score: givingCapacityPoints,
        maxScore: 20,
        description: funder.totalGiving
          ? `$${Number(funder.totalGiving).toLocaleString()} in total giving`
          : 'No giving data available',
      })
      alignmentScore += givingCapacityPoints

      // Existing relationship (0-25 points)
      const relationshipPoints = relationship.totalGrantsReceived > 0
        ? Math.min(relationship.totalGrantsReceived * 5, 25)
        : 0
      alignmentFactors.push({
        factor: 'Existing Relationship',
        score: relationshipPoints,
        maxScore: 25,
        description: relationship.totalGrantsReceived > 0
          ? `${relationship.totalGrantsReceived} previous grants from this funder`
          : 'No prior grant history with this funder',
      })
      alignmentScore += relationshipPoints

      // Active opportunities (0-15 points)
      const oppPoints = funder.opportunities.length > 0
        ? Math.min(funder.opportunities.length * 5, 15)
        : 0
      alignmentFactors.push({
        factor: 'Active Opportunities',
        score: oppPoints,
        maxScore: 15,
        description: funder.opportunities.length > 0
          ? `${funder.opportunities.length} open opportunities with upcoming deadlines`
          : 'No active opportunities found',
      })
      alignmentScore += oppPoints

      // Mission alignment (0-10 points) - simple text overlap check
      let missionPoints = 0
      if (funder.mission && org?.mission) {
        const funderWords = new Set(funder.mission.toLowerCase().split(/\s+/).filter(w => w.length > 4))
        const orgWords = new Set(org.mission.toLowerCase().split(/\s+/).filter(w => w.length > 4))
        const overlap = [...funderWords].filter(w => orgWords.has(w)).length
        missionPoints = Math.min(Math.round((overlap / Math.max(funderWords.size, 1)) * 10), 10)
      }
      alignmentFactors.push({
        factor: 'Mission Alignment',
        score: missionPoints,
        maxScore: 10,
        description: missionPoints > 5
          ? 'Strong mission language overlap'
          : missionPoints > 0
            ? 'Some shared mission language'
            : 'Limited mission text overlap (consider manual review)',
      })
      alignmentScore += missionPoints

      // --- Strategic Recommendations ---
      const recommendations: string[] = []

      if (programAlignmentScore < 30) {
        recommendations.push('Consider emphasizing any shared program areas in your application narrative to strengthen alignment.')
      }
      if (!funder.mission) {
        recommendations.push('This funder has no mission statement on file. Research their website and 990 filings for priority areas.')
      }
      if (relationship.totalGrantsReceived === 0 && funder.pastGrantees.length > 50) {
        recommendations.push('This is a new funder relationship. Review successful peer organizations to understand what this funder values.')
      }
      if (givingGrowthRate !== null && givingGrowthRate > 10) {
        recommendations.push(`This funder is growing their giving (${givingGrowthRate}% over recent years). Consider larger asks.`)
      }
      if (givingGrowthRate !== null && givingGrowthRate < -10) {
        recommendations.push(`This funder has decreased giving recently (${givingGrowthRate}%). Be conservative with budget requests.`)
      }
      if (funder.opportunities.length > 0) {
        const nextDeadline = funder.opportunities[0]
        recommendations.push(`Next deadline: ${nextDeadline.deadline?.toLocaleDateString() || 'TBD'} for "${nextDeadline.title}". Start early.`)
      }
      if (grantSizeStats && grantSizeStats.p75 > 0) {
        recommendations.push(`Target ask between $${grantSizeStats.p25.toLocaleString()} and $${grantSizeStats.p75.toLocaleString()} based on historical giving patterns.`)
      }

      return {
        funder: {
          id: funder.id,
          name: funder.name,
          type: funder.type,
          ein: funder.ein,
          mission: funder.mission,
          website: funder.website,
          city: funder.city,
          state: funder.state,
          nteeCode: funder.nteeCode,
          applicationProcess: funder.applicationProcess,
          applicationDeadline: funder.applicationDeadline,
          contactInfo: funder.contactInfo,
          lastSyncedAt: funder.lastSyncedAt,
        },
        alignment: {
          score: alignmentScore,
          maxScore: 100,
          level: alignmentScore >= 70 ? 'strong' as const : alignmentScore >= 40 ? 'moderate' as const : 'developing' as const,
          factors: alignmentFactors,
        },
        giving: {
          totalAssets: funder.totalAssets ? Number(funder.totalAssets) : null,
          totalGiving: funder.totalGiving ? Number(funder.totalGiving) : null,
          grantSizeStats,
          trend: givingTrend,
          growthRate: givingGrowthRate,
        },
        programFocus: {
          funderAreas,
          orgAreas,
          overlappingAreas,
          topPurposeKeywords,
        },
        relationship,
        opportunities: funder.opportunities.map(o => ({
          id: o.id,
          title: o.title,
          deadline: o.deadline,
          amountMin: o.amountMin,
          amountMax: o.amountMax,
        })),
        recommendations,
      }
    }),

  /**
   * Set alert on a funder - subscribe to updates
   * Creates a FunderAlert record for the org+funder combination
   */
  setAlert: orgProcedure
    .input(
      z.object({
        funderId: z.string(),
        alertOnNewOpportunity: z.boolean().default(true),
        alertOnDeadline: z.boolean().default(true),
        alertOn990Update: z.boolean().default(true),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify funder exists
      const funder = await ctx.db.funder.findUnique({
        where: { id: input.funderId },
        select: { id: true, name: true },
      })

      if (!funder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Funder not found',
        })
      }

      // Upsert the alert (one per org+funder)
      const alert = await ctx.db.funderAlert.upsert({
        where: {
          organizationId_funderId: {
            organizationId: ctx.organizationId,
            funderId: input.funderId,
          },
        },
        create: {
          organizationId: ctx.organizationId,
          funderId: input.funderId,
          createdByUserId: ctx.auth.userId,
          alertOnNewOpportunity: input.alertOnNewOpportunity,
          alertOnDeadline: input.alertOnDeadline,
          alertOn990Update: input.alertOn990Update,
          notes: input.notes,
        },
        update: {
          alertOnNewOpportunity: input.alertOnNewOpportunity,
          alertOnDeadline: input.alertOnDeadline,
          alertOn990Update: input.alertOn990Update,
          notes: input.notes,
          updatedAt: new Date(),
        },
      })

      // Log activity
      logActivity({
        organizationId: ctx.organizationId,
        userId: ctx.auth.userId,
        action: ActivityActions.DISCOVERY_SEARCH,
        entityType: 'funder',
        entityId: input.funderId,
        description: `Set alert on funder "${funder.name}"`,
        metadata: {
          alertOnNewOpportunity: input.alertOnNewOpportunity,
          alertOnDeadline: input.alertOnDeadline,
          alertOn990Update: input.alertOn990Update,
        },
      })

      // Create in-app notification confirming the alert
      await ctx.db.notification.create({
        data: {
          organizationId: ctx.organizationId,
          type: 'SYSTEM',
          title: `Alert set for ${funder.name}`,
          message: `You will be notified about new opportunities, deadlines, and 990 updates for ${funder.name}.`,
          linkUrl: `/opportunities/funders/${input.funderId}`,
        },
      })

      return alert
    }),

  /**
   * Remove alert on a funder
   */
  removeAlert: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.funderAlert.findUnique({
        where: {
          organizationId_funderId: {
            organizationId: ctx.organizationId,
            funderId: input.funderId,
          },
        },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No alert found for this funder',
        })
      }

      await ctx.db.funderAlert.delete({
        where: { id: existing.id },
      })

      return { success: true }
    }),

  /**
   * Get alert status for a specific funder
   */
  getAlert: orgProcedure
    .input(z.object({ funderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.db.funderAlert.findUnique({
        where: {
          organizationId_funderId: {
            organizationId: ctx.organizationId,
            funderId: input.funderId,
          },
        },
      })

      return alert
    }),

  /**
   * List all funder alerts for the organization
   */
  listAlerts: orgProcedure
    .query(async ({ ctx }) => {
      const alerts = await ctx.db.funderAlert.findMany({
        where: { organizationId: ctx.organizationId },
        include: {
          funder: {
            select: {
              id: true,
              name: true,
              type: true,
              totalGiving: true,
              programAreas: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return alerts
    }),
})
