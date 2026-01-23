import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { GrantStatus } from '@prisma/client'
import { STAGE_COLORS } from '@/components/dashboard/pipeline-summary'

export const dashboardRouter = router({
  /**
   * Get dashboard statistics including active grants, pending decisions, YTD awarded, and win rate
   *
   * Metric Definitions:
   * - Active Grants: Count of all grants EXCEPT those in terminal states (DECLINED, COMPLETED)
   *   Includes: PROSPECT, RESEARCHING, WRITING, REVIEW, SUBMITTED, PENDING, AWARDED, ACTIVE, CLOSEOUT
   *
   * - Total Pipeline Value: Sum of amountRequested for all active grants
   *   (Calculated client-side from the grants.list query in Dashboard components)
   *
   * - Pending Decisions: Count of grants with status SUBMITTED or PENDING
   *   Represents grants awaiting funder response
   *
   * - YTD Awarded: Sum of amountAwarded for grants with status=AWARDED and awardedAt >= Jan 1 current year
   *   Only includes grants actually awarded this calendar year
   *
   * - Win Rate: (Awarded Count / Total Decisions) * 100 for current year
   *   Total Decisions = Awarded Count + Declined Count (both YTD)
   *   Returns 0% if no decisions have been made yet
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const lastYear = new Date(now.getFullYear() - 1, 0, 1)
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)

    console.log('[Dashboard Stats] Calculating for org:', ctx.organizationId)
    console.log('[Dashboard Stats] Year:', now.getFullYear(), 'Start of year:', startOfYear)

    // METRIC 1: Active Grants
    // Count all grants in the pipeline (excludes DECLINED and COMPLETED terminal states)
    // This count should match the Pipeline page when no filters are applied
    const activeGrantsCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: {
          notIn: [GrantStatus.DECLINED, GrantStatus.COMPLETED],
        },
      },
    })
    console.log('[Dashboard Stats] Active grants count:', activeGrantsCount)

    // METRIC 2: Pending Decisions
    // Count grants awaiting funder response (SUBMITTED or PENDING status)
    const pendingDecisionsCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: {
          in: [GrantStatus.SUBMITTED, GrantStatus.PENDING],
        },
      },
    })
    console.log('[Dashboard Stats] Pending decisions count (SUBMITTED + PENDING):', pendingDecisionsCount)

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

    // METRIC 3: YTD Awarded
    // Sum of amountAwarded for grants awarded this calendar year
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
    console.log('[Dashboard Stats] YTD awarded:', {
      count: ytdAwardedGrants.length,
      total: ytdAwardedAmount,
      startOfYear: startOfYear.toISOString(),
    })

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

    // METRIC 4: Win Rate
    // Percentage of awarded grants vs total decisions (awarded + declined) for current year
    // Formula: (Awarded Count / Total Decisions) * 100
    const awardedCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.AWARDED,
        awardedAt: {
          gte: startOfYear,
        },
      },
    })

    const declinedCount = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.DECLINED,
        // Declined grants should have submittedAt or updatedAt to determine when they were declined
        // Using updatedAt as proxy for decision date
        updatedAt: {
          gte: startOfYear,
        },
      },
    })

    const totalDecisions = awardedCount + declinedCount
    const winRatePercentage = totalDecisions > 0 ? (awardedCount / totalDecisions) * 100 : 0
    console.log('[Dashboard Stats] Win rate (YTD):', {
      awarded: awardedCount,
      declined: declinedCount,
      total: totalDecisions,
      percentage: winRatePercentage.toFixed(1) + '%',
    })

    // Mock sparkline data (7 data points for the past week)
    // TODO: Implement real sparkline data based on historical trends
    const mockSparkline = [65, 70, 68, 75, 72, 78, 80]

    const stats = {
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

    console.log('[Dashboard Stats] Final stats:', JSON.stringify(stats, null, 2))
    return stats
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

      // Determine severity based on days remaining
      const severity: 'critical' | 'warning' = daysRemaining <= 3 ? 'critical' : 'warning'

      // Determine action type based on status
      let actionType = 'Submit Application'
      if (grant.status === GrantStatus.REVIEW) {
        actionType = 'Review Draft'
      } else if (grant.status === GrantStatus.WRITING) {
        actionType = 'Continue Writing'
      } else if (grant.status === GrantStatus.SUBMITTED) {
        actionType = 'View Status'
      }

      return {
        id: grant.id,
        grantId: grant.id,
        grantName: grant.opportunity?.title || grant.funder?.name || 'Unnamed Grant',
        funderName: grant.funder?.name || 'Unknown Funder',
        daysRemaining,
        severity,
        actionType,
      }
    })
  }),

  /**
   * Get pipeline stages with counts and amounts
   *
   * Returns grants grouped by status, excluding terminal states (DECLINED, COMPLETED).
   * This should match the totals shown on the Pipeline page when no filters are applied.
   *
   * Total Pipeline Value = Sum of all amountRequested across all active grants
   */
  getPipelineStages: orgProcedure.query(async ({ ctx }) => {
    // Group grants by status (excludes DECLINED and COMPLETED to match Dashboard metrics)
    const grants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: {
          // Exclude terminal states - matches grants.list default behavior
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
