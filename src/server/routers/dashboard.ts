import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { GrantStatus } from '@prisma/client'
import { STAGE_COLORS } from '@/components/dashboard/pipeline-summary'

export const dashboardRouter = router({
  /**
   * Get dashboard statistics including active grants, pending decisions, YTD awarded, and win rate
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const lastYear = new Date(now.getFullYear() - 1, 0, 1)
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)

    // Get active grants (all statuses except DECLINED and COMPLETED)
    const activeGrantsCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: {
          notIn: [GrantStatus.DECLINED, GrantStatus.COMPLETED],
        },
      },
    })

    // Get pending decisions count
    const pendingDecisionsCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.SUBMITTED,
      },
    })

    // Get pending decisions due this week
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const pendingDecisionsDueThisWeek = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.SUBMITTED,
        deadline: {
          gte: now,
          lte: nextWeek,
        },
      },
    })

    // Get YTD awarded amount
    const ytdAwardedGrants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.AWARDED,
        awardedAt: {
          gte: startOfYear,
        },
      },
      select: {
        amountAwarded: true,
      },
    })

    const ytdAwardedAmount = ytdAwardedGrants.reduce(
      (sum, grant) => sum + Number(grant.amountAwarded || 0),
      0
    )

    // Get last year's awarded amount for comparison
    const lastYearAwardedGrants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.AWARDED,
        awardedAt: {
          gte: lastYear,
          lte: endOfLastYear,
        },
      },
      select: {
        amountAwarded: true,
      },
    })

    const lastYearAwardedAmount = lastYearAwardedGrants.reduce(
      (sum, grant) => sum + Number(grant.amountAwarded || 0),
      0
    )

    // Calculate YTD trend as percentage change
    const ytdTrend =
      lastYearAwardedAmount > 0
        ? ((ytdAwardedAmount - lastYearAwardedAmount) / lastYearAwardedAmount) * 100
        : 0

    // Calculate win rate
    const awardedCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.AWARDED,
      },
    })

    const declinedCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.DECLINED,
      },
    })

    const totalDecisions = awardedCount + declinedCount
    const winRatePercentage = totalDecisions > 0 ? (awardedCount / totalDecisions) * 100 : 0

    // Mock sparkline data (7 data points for the past week)
    // TODO: Implement real sparkline data based on historical trends
    const mockSparkline = [65, 70, 68, 75, 72, 78, 80]

    return {
      activeGrants: {
        count: activeGrantsCount,
        trend: 5, // Mock trend - TODO: Calculate actual trend
        trendPeriod: 'vs last month',
        sparkline: mockSparkline,
      },
      pendingDecisions: {
        count: pendingDecisionsCount,
        dueThisWeek: pendingDecisionsDueThisWeek,
      },
      ytdAwarded: {
        amount: ytdAwardedAmount,
        trend: Math.round(ytdTrend),
        sparkline: mockSparkline,
      },
      winRate: {
        percentage: Math.round(winRatePercentage),
        trend: 3, // Mock trend - TODO: Calculate actual trend
        sparkline: mockSparkline,
      },
    }
  }),

  /**
   * Get urgent actions (deadlines within 14 days or overdue by up to 7 days)
   */
  getUrgentActions: orgProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const fourteenDaysFromNow = new Date(now)
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Query grants with deadline in the next 14 days OR overdue by up to 7 days
    const urgentGrants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        deadline: {
          gte: sevenDaysAgo,
          lte: fourteenDaysFromNow,
        },
        status: {
          notIn: [GrantStatus.DECLINED, GrantStatus.COMPLETED, GrantStatus.AWARDED],
        },
      },
      orderBy: {
        deadline: 'asc',
      },
      include: {
        funder: {
          select: {
            name: true,
          },
        },
        opportunity: {
          select: {
            title: true,
          },
        },
      },
    })

    // Map to UrgentAction format
    return urgentGrants.map((grant) => {
      const deadline = grant.deadline!
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Determine action type based on status
      let type: 'deadline' | 'report' | 'contract' | 'review' = 'deadline'
      let actionLabel = 'Review'

      if (grant.status === GrantStatus.REVIEW) {
        type = 'review'
        actionLabel = 'Review Draft'
      } else if (grant.status === GrantStatus.WRITING) {
        type = 'deadline'
        actionLabel = 'Continue Writing'
      } else if (grant.status === GrantStatus.SUBMITTED) {
        type = 'deadline'
        actionLabel = 'View Status'
      }

      return {
        id: grant.id,
        type,
        title: grant.opportunity?.title || grant.funder?.name || 'Grant Application',
        grantName: grant.opportunity?.title || grant.funder?.name || 'Unnamed Grant',
        funderName: grant.funder?.name || 'Unknown Funder',
        daysRemaining,
        actionLabel,
        actionHref: `/grants/${grant.id}`,
      }
    })
  }),

  /**
   * Get pipeline stages with counts and amounts
   */
  getPipelineStages: orgProcedure.query(async ({ ctx }) => {
    // Group grants by status
    const grants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: {
          // Exclude terminal states for pipeline view
          notIn: [GrantStatus.DECLINED, GrantStatus.COMPLETED],
        },
      },
      select: {
        status: true,
        amountRequested: true,
      },
    })

    // Aggregate by status
    const stageMap = new Map<
      GrantStatus,
      { count: number; amount: number }
    >()

    grants.forEach((grant) => {
      const existing = stageMap.get(grant.status) || { count: 0, amount: 0 }
      stageMap.set(grant.status, {
        count: existing.count + 1,
        amount: existing.amount + Number(grant.amountRequested || 0),
      })
    })

    // Map to PipelineStage format with colors
    const stages = Array.from(stageMap.entries()).map(([status, data]) => {
      // Get color from STAGE_COLORS if available, otherwise use default
      const colorKey = status as keyof typeof STAGE_COLORS
      const color = colorKey in STAGE_COLORS ? STAGE_COLORS[colorKey] : '#64748b'

      return {
        id: status,
        name: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
        count: data.count,
        amount: data.amount,
        color,
      }
    })

    // Sort by typical pipeline order
    const statusOrder: GrantStatus[] = [
      GrantStatus.PROSPECT,
      GrantStatus.RESEARCHING,
      GrantStatus.WRITING,
      GrantStatus.REVIEW,
      GrantStatus.SUBMITTED,
      GrantStatus.PENDING,
      GrantStatus.AWARDED,
      GrantStatus.ACTIVE,
      GrantStatus.CLOSEOUT,
    ]

    stages.sort((a, b) => {
      const aIndex = statusOrder.indexOf(a.id as GrantStatus)
      const bIndex = statusOrder.indexOf(b.id as GrantStatus)
      return aIndex - bIndex
    })

    return stages
  }),

  /**
   * Get recent activity feed
   * TODO: Implement ActivityLog model and real activity tracking
   */
  getRecentActivity: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // For now, return mock data
      // TODO: Query from ActivityLog model once implemented
      return []
    }),

  /**
   * Get AI-generated insights
   * TODO: Connect to Claude API for real insights
   */
  getAIInsights: orgProcedure.query(async ({ ctx }) => {
    // For now, return mock insights
    // TODO: Implement Claude API integration for personalized insights

    // Get some real data to generate basic insights
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingDeadlines = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        deadline: {
          gte: new Date(),
          lte: nextWeek,
        },
        status: {
          in: [GrantStatus.WRITING, GrantStatus.REVIEW],
        },
      },
    })

    const insights = []

    if (upcomingDeadlines > 0) {
      insights.push({
        id: '1',
        type: 'deadline' as const,
        title: 'Upcoming Deadlines Require Attention',
        description: `You have ${upcomingDeadlines} grant${upcomingDeadlines > 1 ? 's' : ''} with deadlines in the next 7 days that ${upcomingDeadlines > 1 ? 'are' : 'is'} still in writing or review stage.`,
        actionLabel: 'View Grants',
        actionHref: '/grants?filter=deadline-soon',
      })
    }

    return insights
  }),
})
