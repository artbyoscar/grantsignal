import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { GrantStatus } from '@prisma/client'

export const reportsRouter = router({
  /**
   * Get monthly summary report data
   */
  monthlySummary: orgProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2000).max(2100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { month, year } = input

      // Calculate date range for the specified month
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)

      // Get all grants for the organization
      const allGrants = await ctx.db.grant.findMany({
        where: {
          organizationId: ctx.organizationId,
        },
        include: {
          funder: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              title: true,
              deadline: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Calculate total pipeline value (all active pipeline grants)
      const pipelineStatuses: GrantStatus[] = [
        'PROSPECT',
        'RESEARCHING',
        'WRITING',
        'REVIEW',
        'SUBMITTED',
        'PENDING',
      ]
      const pipelineGrants = allGrants.filter((g) => pipelineStatuses.includes(g.status))
      const totalPipelineValue = pipelineGrants.reduce(
        (sum, g) => sum + Number(g.amountRequested || 0),
        0
      )

      // Grants submitted this month
      const submittedThisMonth = allGrants.filter((g) => {
        if (!g.submittedAt) return false
        const submittedDate = new Date(g.submittedAt)
        return submittedDate >= startDate && submittedDate <= endDate
      })

      // Grants awarded this month
      const awardedThisMonth = allGrants.filter((g) => {
        if (!g.awardedAt) return false
        const awardedDate = new Date(g.awardedAt)
        return awardedDate >= startDate && awardedDate <= endDate
      })
      const awardedThisMonthValue = awardedThisMonth.reduce(
        (sum, g) => sum + Number(g.amountAwarded || 0),
        0
      )

      // Grants declined this month (check if status changed to DECLINED in this month)
      // For simplicity, we'll count grants currently in DECLINED status
      const declinedThisMonth = allGrants.filter((g) => {
        if (g.status !== 'DECLINED') return false
        // Use updatedAt as proxy for when status changed
        const updatedDate = new Date(g.updatedAt)
        return updatedDate >= startDate && updatedDate <= endDate
      })

      // Win rate this month: awarded / (awarded + declined) * 100
      const totalDecisions = awardedThisMonth.length + declinedThisMonth.length
      const winRate = totalDecisions > 0 ? (awardedThisMonth.length / totalDecisions) * 100 : 0

      // Pipeline by status breakdown
      const pipelineByStatus = [
        {
          status: 'PROSPECT',
          count: allGrants.filter((g) => g.status === 'PROSPECT').length,
          totalValue: allGrants
            .filter((g) => g.status === 'PROSPECT')
            .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0),
        },
        {
          status: 'RESEARCHING',
          count: allGrants.filter((g) => g.status === 'RESEARCHING').length,
          totalValue: allGrants
            .filter((g) => g.status === 'RESEARCHING')
            .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0),
        },
        {
          status: 'WRITING',
          count: allGrants.filter((g) => g.status === 'WRITING').length,
          totalValue: allGrants
            .filter((g) => g.status === 'WRITING')
            .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0),
        },
        {
          status: 'REVIEW',
          count: allGrants.filter((g) => g.status === 'REVIEW').length,
          totalValue: allGrants
            .filter((g) => g.status === 'REVIEW')
            .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0),
        },
        {
          status: 'SUBMITTED',
          count: allGrants.filter((g) => g.status === 'SUBMITTED').length,
          totalValue: allGrants
            .filter((g) => g.status === 'SUBMITTED')
            .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0),
        },
        {
          status: 'PENDING',
          count: allGrants.filter((g) => g.status === 'PENDING').length,
          totalValue: allGrants
            .filter((g) => g.status === 'PENDING')
            .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0),
        },
        {
          status: 'AWARDED',
          count: allGrants.filter((g) => g.status === 'AWARDED').length,
          totalValue: allGrants
            .filter((g) => g.status === 'AWARDED')
            .reduce((sum, g) => sum + Number(g.amountAwarded || 0), 0),
        },
      ]

      // Calculate totals
      const totalCount = pipelineByStatus.reduce((sum, s) => sum + s.count, 0)
      const totalValue = pipelineByStatus.reduce((sum, s) => sum + s.totalValue, 0)

      // Upcoming deadlines (next 30 days from end of selected month)
      const thirtyDaysFromEndOfMonth = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcomingDeadlines = allGrants
        .filter((g) => {
          if (!g.deadline) return false
          const deadline = new Date(g.deadline)
          return deadline > endDate && deadline <= thirtyDaysFromEndOfMonth
        })
        .sort((a, b) => {
          const dateA = a.deadline ? new Date(a.deadline).getTime() : 0
          const dateB = b.deadline ? new Date(b.deadline).getTime() : 0
          return dateA - dateB
        })

      // Recent activity (submitted, awarded, declined in this month)
      const recentActivity = [
        ...submittedThisMonth.map((g) => ({
          type: 'submitted' as const,
          grant: g,
          date: g.submittedAt!,
        })),
        ...awardedThisMonth.map((g) => ({
          type: 'awarded' as const,
          grant: g,
          date: g.awardedAt!,
        })),
        ...declinedThisMonth.map((g) => ({
          type: 'declined' as const,
          grant: g,
          date: g.updatedAt,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // By program breakdown
      const programBreakdown = await ctx.db.program.findMany({
        where: {
          organizationId: ctx.organizationId,
        },
        select: {
          id: true,
          name: true,
        },
      })

      const byProgram = programBreakdown.map((program) => {
        const programGrants = allGrants.filter((g) => g.programId === program.id)
        return {
          programId: program.id,
          programName: program.name,
          active: programGrants.filter((g) =>
            ['PROSPECT', 'RESEARCHING', 'WRITING', 'REVIEW'].includes(g.status)
          ).length,
          submitted: programGrants.filter((g) =>
            ['SUBMITTED', 'PENDING'].includes(g.status)
          ).length,
          awarded: programGrants.filter((g) =>
            ['AWARDED', 'ACTIVE', 'CLOSEOUT', 'COMPLETED'].includes(g.status)
          ).length,
          declined: programGrants.filter((g) => g.status === 'DECLINED').length,
        }
      })

      // Add "No Program" category
      const noProgramGrants = allGrants.filter((g) => !g.programId)
      if (noProgramGrants.length > 0) {
        byProgram.push({
          programId: null,
          programName: 'No Program Assigned',
          active: noProgramGrants.filter((g) =>
            ['PROSPECT', 'RESEARCHING', 'WRITING', 'REVIEW'].includes(g.status)
          ).length,
          submitted: noProgramGrants.filter((g) =>
            ['SUBMITTED', 'PENDING'].includes(g.status)
          ).length,
          awarded: noProgramGrants.filter((g) =>
            ['AWARDED', 'ACTIVE', 'CLOSEOUT', 'COMPLETED'].includes(g.status)
          ).length,
          declined: noProgramGrants.filter((g) => g.status === 'DECLINED').length,
        })
      }

      return {
        executiveSummary: {
          totalGrantsInPipeline: pipelineGrants.length,
          totalPipelineValue,
          grantsSubmittedThisMonth: submittedThisMonth.length,
          grantsAwardedThisMonth: awardedThisMonth.length,
          grantsAwardedValue: awardedThisMonthValue,
          grantsDeclinedThisMonth: declinedThisMonth.length,
          winRate,
        },
        pipelineByStatus: [...pipelineByStatus, { status: 'TOTAL', count: totalCount, totalValue }],
        upcomingDeadlines,
        recentActivity,
        byProgram,
      }
    }),

  /**
   * Get current pipeline snapshot
   */
  pipelineSnapshot: orgProcedure.query(async ({ ctx }) => {
    const grants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
      },
      include: {
        funder: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Group by status
    const statusGroups = Object.values(GrantStatus).map((status) => {
      const statusGrants = grants.filter((g) => g.status === status)
      const totalValue = statusGrants.reduce(
        (sum, g) =>
          sum + Number(status === 'AWARDED' ? g.amountAwarded || 0 : g.amountRequested || 0),
        0
      )

      return {
        status,
        count: statusGrants.length,
        totalValue,
        grants: statusGrants,
      }
    })

    return {
      statusGroups: statusGroups.filter((g) => g.count > 0),
      totalGrants: grants.length,
      totalValue: statusGroups.reduce((sum, g) => sum + g.totalValue, 0),
    }
  }),
})
