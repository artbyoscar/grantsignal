'use client'

import { useUser } from '@clerk/nextjs'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { PipelineSummary } from '@/components/dashboard/pipeline-summary'
import { GrantsByProgram } from '@/components/dashboard/grants-by-program'
import { ReportsWidget } from '@/components/dashboard/reports-widget'
import { FitOpportunitiesWidget } from '@/components/dashboard/fit-opportunities-widget'
import { ComplianceWidget } from '@/components/dashboard/compliance-widget'
import { Skeleton } from '@/components/ui/skeleton'
import { TourOverlay } from '@/components/onboarding/tour-overlay'
import { api } from '@/lib/trpc/client'

export default function DashboardPage() {
  const { user } = useUser()
  const { data, isLoading, error } = api.grants.list.useQuery({})
  const { data: programsData, isLoading: programsLoading } = api.programs.list.useQuery()

  // Calculate stats from grants data
  const stats = data?.grants
    ? (() => {
        const currentYear = new Date().getFullYear()
        const grants = data.grants

        // Active Grants: AWARDED or ACTIVE status
        const activeGrants = grants.filter(
          (g) => g.status === 'AWARDED' || g.status === 'ACTIVE'
        ).length

        // Pending Decisions: SUBMITTED or PENDING status
        const pendingDecisions = grants.filter(
          (g) => g.status === 'SUBMITTED' || g.status === 'PENDING'
        ).length

        // YTD Awarded: sum of amountAwarded for current year
        const ytdAwarded = grants
          .filter(
            (g) =>
              g.amountAwarded &&
              g.awardedAt &&
              new Date(g.awardedAt).getFullYear() === currentYear
          )
          .reduce((sum, g) => sum + Number(g.amountAwarded || 0), 0)

        // Win Rate: (awarded / total submitted) * 100
        const submittedGrants = grants.filter(
          (g) =>
            g.status === 'AWARDED' ||
            g.status === 'DECLINED' ||
            g.status === 'ACTIVE' ||
            g.status === 'CLOSEOUT' ||
            g.status === 'COMPLETED'
        ).length
        const awardedGrants = grants.filter(
          (g) =>
            g.status === 'AWARDED' ||
            g.status === 'ACTIVE' ||
            g.status === 'CLOSEOUT' ||
            g.status === 'COMPLETED'
        ).length
        const winRate = submittedGrants > 0 ? (awardedGrants / submittedGrants) * 100 : 0

        return {
          activeGrants,
          pendingDecisions,
          ytdAwarded,
          winRate,
        }
      })()
    : null

  // Filter grants with deadline within 14 days
  const urgentGrants = data?.grants
    ? data.grants.filter((g) => {
        if (!g.deadline) return false
        const deadline = new Date(g.deadline)
        const now = new Date()
        const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        return deadline >= now && deadline <= fourteenDaysFromNow
      })
    : []

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.firstName || 'there'}!</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-medium">Error loading dashboard data</h3>
              <p className="text-slate-300 text-sm mt-1">
                {error.message || 'Failed to fetch grants data. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <TourOverlay />
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Welcome back, {user?.firstName || 'there'}!</p>
        </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              label="Active Grants"
              value={stats?.activeGrants.toString() || '0'}
              trend={{
                value: stats?.activeGrants === 0 ? 'No active grants' : 'Currently active',
                direction: 'neutral',
              }}
            />
            <StatCard
              label="Pending Decisions"
              value={stats?.pendingDecisions.toString() || '0'}
              trend={{
                value: stats?.pendingDecisions === 0 ? 'No pending' : 'Awaiting response',
                direction: 'neutral',
              }}
            />
            <StatCard
              label="YTD Awarded"
              value={`$${stats?.ytdAwarded.toLocaleString() || '0'}`}
              trend={{
                value: stats?.ytdAwarded === 0 ? 'Start applying!' : 'This year',
                direction: 'neutral',
              }}
            />
            <StatCard
              label="Win Rate"
              value={`${stats?.winRate.toFixed(0) || '0'}%`}
              trend={{
                value: stats?.winRate === 0 ? 'No data yet' : 'Success rate',
                direction: 'neutral',
              }}
            />
          </>
        )}
      </div>

      {/* Pipeline Summary and Grants by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineSummary grants={data?.grants || []} isLoading={isLoading} />
        <GrantsByProgram
          grants={data?.grants || []}
          programs={programsData || []}
          isLoading={isLoading || programsLoading}
        />
      </div>

      {/* Fit Opportunities and Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FitOpportunitiesWidget />
        <ComplianceWidget />
      </div>

      {/* Monthly Summary */}
      <ReportsWidget />

      {/* Urgent Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Urgent Actions</h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : urgentGrants.length > 0 ? (
            <div className="space-y-3">
              {urgentGrants.map((grant) => {
                const daysUntilDeadline = grant.deadline
                  ? Math.ceil(
                      (new Date(grant.deadline).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null

                return (
                  <div
                    key={grant.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {grant.opportunity?.title || grant.funder?.name || 'Untitled Grant'}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          Deadline in {daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="text-slate-300 font-medium">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No urgent actions needed</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-slate-300 font-medium">No recent activity</p>
            <p className="text-sm text-slate-500 mt-1">Activity will appear here as you work</p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
