'use client'

import { useState } from 'react'
import { FileText, TrendingUp, Target, Award, DollarSign, Calendar } from 'lucide-react'
import { MonthlySummary } from '@/components/reports/monthly-summary'
import { ExecutiveSummary } from '@/components/reports/executive-summary'
import { StatCard } from '@/components/dashboard/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/trpc/client'

type ReportType = 'monthly' | 'executive' | 'pipeline' | 'winrate' | 'funder' | null

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null)
  const [dateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  // Fetch grants data for quick stats
  const { data: grantsData, isLoading: grantsLoading } = api.grants.list.useQuery({})

  // Calculate quick stats
  const stats = grantsData?.grants
    ? (() => {
        const currentYear = new Date().getFullYear()
        const grants = grantsData.grants

        // Total grants
        const totalGrants = grants.length

        // YTD Awarded
        const ytdAwarded = grants
          .filter(
            (g) =>
              g.amountAwarded &&
              g.awardedAt &&
              new Date(g.awardedAt).getFullYear() === currentYear
          )
          .reduce((sum, g) => sum + Number(g.amountAwarded || 0), 0)

        // Win Rate
        const decidedGrants = grants.filter(
          (g) => g.status === 'AWARDED' || g.status === 'DECLINED'
        )
        const awardedGrants = grants.filter((g) => g.status === 'AWARDED')
        const winRate = decidedGrants.length > 0 ? (awardedGrants.length / decidedGrants.length) * 100 : 0

        // Active Pipeline Value
        const pipelineStatuses = ['PROSPECT', 'RESEARCHING', 'WRITING', 'REVIEW', 'SUBMITTED', 'PENDING']
        const pipelineValue = grants
          .filter((g) => pipelineStatuses.includes(g.status))
          .reduce((sum, g) => sum + Number(g.amountRequested || 0), 0)

        return {
          totalGrants,
          ytdAwarded,
          winRate,
          pipelineValue,
        }
      })()
    : null

  const reportCards = [
    {
      id: 'executive' as const,
      title: 'Executive Summary',
      description: 'One-page overview of grant activity and key metrics',
      icon: FileText,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'monthly' as const,
      title: 'Monthly Summary',
      description: 'Comprehensive monthly performance report for leadership',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'pipeline' as const,
      title: 'Pipeline Report',
      description: 'All grants by status with amounts and details',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      comingSoon: true,
    },
    {
      id: 'winrate' as const,
      title: 'Win/Loss Analysis',
      description: 'Success rates by funder type and program area',
      icon: Target,
      color: 'from-amber-500 to-orange-500',
      comingSoon: true,
    },
    {
      id: 'funder' as const,
      title: 'Funder Report',
      description: 'Deep dive on specific funder relationships',
      icon: Award,
      color: 'from-red-500 to-pink-500',
      comingSoon: true,
    },
  ]

  // If a report is active, show it
  if (activeReport === 'monthly') {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setActiveReport(null)}
            className="text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            ← Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-white">Monthly Summary Report</h1>
          <p className="text-slate-400 mt-1">
            Generate comprehensive monthly reports for leadership review
          </p>
        </div>

        <MonthlySummary />
      </div>
    )
  }

  if (activeReport === 'executive') {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setActiveReport(null)}
            className="text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            ← Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-white">Executive Summary Report</h1>
          <p className="text-slate-400 mt-1">
            One-page overview of grant activity and portfolio performance
          </p>
        </div>

        <ExecutiveSummary dateRange={dateRange} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">
          Generate comprehensive reports on your grant portfolio and performance
        </p>
      </div>

      {/* Quick Stats */}
      {grantsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Grants"
            value={stats.totalGrants}
            trendLabel="Across all statuses"
          />
          <StatCard
            label="Total Awarded YTD"
            value={`$${(stats.ytdAwarded / 1000000).toFixed(1)}M`}
            trendLabel="Current year funding"
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(0)}%`}
            trendLabel="Success rate"
          />
          <StatCard
            label="Active Pipeline Value"
            value={`$${(stats.pipelineValue / 1000000).toFixed(1)}M`}
            trendLabel="Potential funding"
          />
        </div>
      ) : null}

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.id}
              onClick={() => !report.comingSoon && setActiveReport(report.id)}
              disabled={report.comingSoon}
              className={`
                relative overflow-hidden bg-slate-800 border border-slate-700 rounded-lg p-6
                transition-all duration-200 text-left
                ${
                  report.comingSoon
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-slate-600 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                }
              `}
            >
              {/* Background gradient */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${report.color} opacity-10 blur-3xl`}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${report.color} bg-opacity-10`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {report.comingSoon && (
                    <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{report.title}</h3>
                <p className="text-sm text-slate-400">{report.description}</p>

                {!report.comingSoon && (
                  <div className="mt-4 text-sm font-medium text-blue-400">
                    Click to generate →
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Quick Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-2">About Reports</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Reports are designed for easy sharing with leadership, board members, and stakeholders.
          Each report can be exported as PDF and scheduled for automatic delivery. Historical
          reports are saved for future reference and trend analysis.
        </p>
      </div>
    </div>
  )
}
