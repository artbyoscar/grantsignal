import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { GrantStatus } from '@prisma/client'
import { STAGE_COLORS } from '@/components/dashboard/pipeline-summary'

/**
 * Helper: compute a 7-point sparkline from grant counts over the last 7 months.
 * Each point is the active-grant count at the end of that month.
 */
async function computeMonthlySparkline(
  db: Parameters<Parameters<typeof orgProcedure.query>[0]>['ctx']['db'],
  organizationId: string,
  statusFilter: GrantStatus[]
) {
  const now = new Date()
  const points: number[] = []

  for (let i = 6; i >= 0; i--) {
    const asOf = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59) // end of month
    const count = await db.grant.count({
      where: {
        organizationId,
        status: { in: statusFilter },
        createdAt: { lte: asOf },
      },
    })
    points.push(count)
  }
  return points
}

export const dashboardRouter = router({
  /**
   * Get dashboard statistics with real trends
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const lastYear = new Date(now.getFullYear() - 1, 0, 1)
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Active statuses (everything except terminal)
    const activeStatuses = [
      GrantStatus.PROSPECT, GrantStatus.RESEARCHING, GrantStatus.WRITING,
      GrantStatus.REVIEW, GrantStatus.SUBMITTED, GrantStatus.PENDING,
      GrantStatus.AWARDED, GrantStatus.ACTIVE, GrantStatus.CLOSEOUT,
    ]

    // METRIC 1: Active Grants + trend
    const activeGrantsCount = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: { in: activeStatuses } },
    })

    const activeGrantsLastMonth = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: { in: activeStatuses },
        createdAt: { lte: oneMonthAgo },
      },
    })

    const activeGrantsTrend = activeGrantsLastMonth > 0
      ? Math.round(((activeGrantsCount - activeGrantsLastMonth) / activeGrantsLastMonth) * 100)
      : 0

    // METRIC 2: Pending Decisions
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const pendingDecisionsCount = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: { in: [GrantStatus.SUBMITTED, GrantStatus.PENDING] } },
    })

    const pendingDecisionsDueThisWeek = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.SUBMITTED,
        deadline: { gte: now, lte: nextWeek },
      },
    })

    // METRIC 3: YTD Awarded + trend vs last year
    const ytdAwardedGrants = await ctx.db.grant.findMany({
      where: { organizationId: ctx.organizationId, status: GrantStatus.AWARDED, awardedAt: { gte: startOfYear } },
      select: { amountAwarded: true },
    })
    const ytdAwardedAmount = ytdAwardedGrants.reduce((sum, g) => sum + Number(g.amountAwarded || 0), 0)

    const lastYearAwardedGrants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: GrantStatus.AWARDED,
        awardedAt: { gte: lastYear, lte: endOfLastYear },
      },
      select: { amountAwarded: true },
    })
    const lastYearAwardedAmount = lastYearAwardedGrants.reduce((sum, g) => sum + Number(g.amountAwarded || 0), 0)
    const ytdTrend = lastYearAwardedAmount > 0
      ? ((ytdAwardedAmount - lastYearAwardedAmount) / lastYearAwardedAmount) * 100
      : 0

    // METRIC 4: Win Rate + trend
    const awardedCount = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: GrantStatus.AWARDED, awardedAt: { gte: startOfYear } },
    })
    const declinedCount = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: GrantStatus.DECLINED, updatedAt: { gte: startOfYear } },
    })
    const totalDecisions = awardedCount + declinedCount
    const winRatePercentage = totalDecisions > 0 ? (awardedCount / totalDecisions) * 100 : 0

    // Last year win rate for trend comparison
    const awardedLastYear = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: GrantStatus.AWARDED, awardedAt: { gte: lastYear, lte: endOfLastYear } },
    })
    const declinedLastYear = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: GrantStatus.DECLINED, updatedAt: { gte: lastYear, lte: endOfLastYear } },
    })
    const totalDecisionsLastYear = awardedLastYear + declinedLastYear
    const winRateLastYear = totalDecisionsLastYear > 0 ? (awardedLastYear / totalDecisionsLastYear) * 100 : 0
    const winRateTrend = Math.round(winRatePercentage - winRateLastYear)

    // Sparklines: monthly active grant counts over past 7 months
    const activeSparkline = await computeMonthlySparkline(ctx.db, ctx.organizationId, activeStatuses)

    return {
      activeGrants: {
        count: activeGrantsCount,
        trend: activeGrantsTrend,
        trendPeriod: 'vs last month',
        sparkline: activeSparkline,
      },
      pendingDecisions: {
        count: pendingDecisionsCount,
        dueThisWeek: pendingDecisionsDueThisWeek,
      },
      ytdAwarded: {
        amount: ytdAwardedAmount,
        trend: Math.round(ytdTrend),
        sparkline: activeSparkline,
      },
      winRate: {
        percentage: Math.round(winRatePercentage),
        trend: winRateTrend,
        sparkline: activeSparkline,
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

    const urgentGrants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        deadline: { gte: sevenDaysAgo, lte: fourteenDaysFromNow },
        status: { notIn: [GrantStatus.DECLINED, GrantStatus.COMPLETED, GrantStatus.AWARDED] },
      },
      orderBy: { deadline: 'asc' },
      include: {
        funder: { select: { name: true } },
        opportunity: { select: { title: true } },
      },
    })

    return urgentGrants.map((grant) => {
      const deadline = grant.deadline!
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const severity: 'critical' | 'warning' = daysRemaining <= 3 ? 'critical' : 'warning'

      let actionType = 'Submit Application'
      if (grant.status === GrantStatus.REVIEW) actionType = 'Review Draft'
      else if (grant.status === GrantStatus.WRITING) actionType = 'Continue Writing'
      else if (grant.status === GrantStatus.SUBMITTED) actionType = 'View Status'

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
   */
  getPipelineStages: orgProcedure.query(async ({ ctx }) => {
    const grants = await ctx.db.grant.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { notIn: [GrantStatus.DECLINED, GrantStatus.COMPLETED] },
      },
      select: { status: true, amountRequested: true },
    })

    const stageMap = new Map<GrantStatus, { count: number; amount: number }>()
    grants.forEach((grant) => {
      const existing = stageMap.get(grant.status) || { count: 0, amount: 0 }
      stageMap.set(grant.status, {
        count: existing.count + 1,
        amount: existing.amount + Number(grant.amountRequested || 0),
      })
    })

    const stages = Array.from(stageMap.entries()).map(([status, data]) => {
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

    const statusOrder: GrantStatus[] = [
      GrantStatus.PROSPECT, GrantStatus.RESEARCHING, GrantStatus.WRITING,
      GrantStatus.REVIEW, GrantStatus.SUBMITTED, GrantStatus.PENDING,
      GrantStatus.AWARDED, GrantStatus.ACTIVE, GrantStatus.CLOSEOUT,
    ]
    stages.sort((a, b) => statusOrder.indexOf(a.id as GrantStatus) - statusOrder.indexOf(b.id as GrantStatus))
    return stages
  }),

  /**
   * Get recent activity feed from ActivityLog
   */
  getRecentActivity: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.activityLog.findMany({
        where: { organizationId: ctx.organizationId },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      })

      const hasMore = activities.length > input.limit
      const items = hasMore ? activities.slice(0, -1) : activities

      return {
        items: items.map((a) => ({
          id: a.id,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          description: a.description,
          userId: a.userId,
          metadata: a.metadata,
          createdAt: a.createdAt,
        })),
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      }
    }),

  /**
   * Get AI-generated insights based on real org data
   */
  getAIInsights: orgProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const insights: Array<{
      id: string
      type: 'deadline' | 'opportunity' | 'compliance' | 'capacity' | 'performance'
      title: string
      description: string
      actionLabel: string
      actionHref: string
    }> = []

    // 1. Upcoming deadline urgency
    const urgentGrants = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        deadline: { gte: now, lte: nextWeek },
        status: { in: [GrantStatus.WRITING, GrantStatus.REVIEW] },
      },
    })
    if (urgentGrants > 0) {
      insights.push({
        id: 'deadline-urgency',
        type: 'deadline',
        title: 'Upcoming Deadlines Require Attention',
        description: `You have ${urgentGrants} grant${urgentGrants > 1 ? 's' : ''} with deadlines in the next 7 days still in writing or review stage.`,
        actionLabel: 'View Pipeline',
        actionHref: '/pipeline',
      })
    }

    // 2. Stale grants (no updates in 30+ days)
    const staleGrants = await ctx.db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        status: { in: [GrantStatus.PROSPECT, GrantStatus.RESEARCHING, GrantStatus.WRITING] },
        updatedAt: { lt: thirtyDaysAgo },
      },
    })
    if (staleGrants > 0) {
      insights.push({
        id: 'stale-grants',
        type: 'performance',
        title: 'Stale Grants Need Review',
        description: `${staleGrants} grant${staleGrants > 1 ? 's have' : ' has'} not been updated in over 30 days. Consider advancing or archiving them.`,
        actionLabel: 'Review Grants',
        actionHref: '/pipeline',
      })
    }

    // 3. Unresolved compliance conflicts
    const unresolvedConflicts = await ctx.db.commitmentConflict.count({
      where: {
        commitment: { organizationId: ctx.organizationId },
        status: 'UNRESOLVED',
        severity: { in: ['HIGH', 'CRITICAL'] },
      },
    })
    if (unresolvedConflicts > 0) {
      insights.push({
        id: 'compliance-conflicts',
        type: 'compliance',
        title: 'Compliance Conflicts Need Resolution',
        description: `${unresolvedConflicts} high or critical compliance conflict${unresolvedConflicts > 1 ? 's require' : ' requires'} your attention.`,
        actionLabel: 'View Compliance',
        actionHref: '/compliance',
      })
    }

    // 4. Documents pending processing
    const pendingDocs = await ctx.db.document.count({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    })
    if (pendingDocs > 0) {
      insights.push({
        id: 'pending-documents',
        type: 'capacity',
        title: 'Documents Awaiting Processing',
        description: `${pendingDocs} document${pendingDocs > 1 ? 's are' : ' is'} still being processed. Content from these documents is not yet available for grant writing.`,
        actionLabel: 'View Documents',
        actionHref: '/documents',
      })
    }

    // 5. Win rate performance
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const awardedCount = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: GrantStatus.AWARDED, awardedAt: { gte: startOfYear } },
    })
    const declinedCount = await ctx.db.grant.count({
      where: { organizationId: ctx.organizationId, status: GrantStatus.DECLINED, updatedAt: { gte: startOfYear } },
    })
    const totalDecisions = awardedCount + declinedCount
    if (totalDecisions >= 3) {
      const winRate = Math.round((awardedCount / totalDecisions) * 100)
      if (winRate >= 50) {
        insights.push({
          id: 'win-rate-strong',
          type: 'performance',
          title: 'Strong Win Rate This Year',
          description: `Your ${winRate}% win rate across ${totalDecisions} decisions is above the nonprofit average. Consider targeting more competitive opportunities.`,
          actionLabel: 'View Reports',
          actionHref: '/reports',
        })
      } else if (winRate < 30) {
        insights.push({
          id: 'win-rate-low',
          type: 'performance',
          title: 'Win Rate Needs Attention',
          description: `Your ${winRate}% win rate this year is below typical. Review fit scores before submitting and consider focusing on better-matched opportunities.`,
          actionLabel: 'View Opportunities',
          actionHref: '/opportunities',
        })
      }
    }

    return insights
  }),

  /**
   * Get setup progress for post-onboarding checklist.
   * Returns completion status for key first-run actions.
   * Once all items are done, the checklist hides itself.
   */
  getSetupProgress: orgProcedure.query(async ({ ctx }) => {
    const [
      org,
      documentCount,
      grantCount,
      programCount,
      teamMemberCount,
    ] = await Promise.all([
      ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: {
          name: true,
          mission: true,
          voiceProfile: true,
          primaryProgramAreas: true,
        },
      }),
      ctx.db.document.count({
        where: { organizationId: ctx.organizationId, status: 'COMPLETED' },
      }),
      ctx.db.grant.count({
        where: { organizationId: ctx.organizationId },
      }),
      ctx.db.program.count({
        where: { organizationId: ctx.organizationId },
      }),
      ctx.db.organizationMember.count({
        where: { organizationId: ctx.organizationId },
      }),
    ])

    const steps = [
      {
        id: 'profile',
        title: 'Complete your organization profile',
        description: 'Add your mission statement and program areas to improve AI matching',
        href: '/settings',
        completed: !!(org?.name && org?.mission && (org?.primaryProgramAreas?.length ?? 0) > 0),
      },
      {
        id: 'documents',
        title: 'Upload past proposals or reports',
        description: 'Train GrantSignal on your writing style and organizational history',
        href: '/documents?upload=true',
        completed: documentCount >= 1,
      },
      {
        id: 'grant',
        title: 'Add your first grant to the pipeline',
        description: 'Start tracking an opportunity from prospect to award',
        href: '/pipeline',
        completed: grantCount >= 1,
      },
      {
        id: 'voice',
        title: 'Run voice analysis',
        description: 'Capture your unique writing voice for AI-assisted drafting',
        href: '/settings/voice',
        completed: !!org?.voiceProfile,
      },
      {
        id: 'team',
        title: 'Invite a team member',
        description: 'Collaborate on grants with colleagues',
        href: '/settings/team',
        completed: teamMemberCount > 1, // >1 because the creator is member #1
      },
    ]

    const completedCount = steps.filter(s => s.completed).length
    const allDone = completedCount === steps.length

    return {
      steps,
      completedCount,
      totalCount: steps.length,
      percentComplete: Math.round((completedCount / steps.length) * 100),
      allDone,
    }
  }),
})
