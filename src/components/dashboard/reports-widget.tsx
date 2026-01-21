'use client'

import { FileText, ArrowRight, TrendingUp, Target } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

const CURRENT_DATE = new Date()
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1
const CURRENT_YEAR = CURRENT_DATE.getFullYear()

export function ReportsWidget() {
  const { data, isLoading } = api.reports.monthlySummary.useQuery({
    month: CURRENT_MONTH,
    year: CURRENT_YEAR,
  })

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <Skeleton className="h-48" />
      </div>
    )
  }

  const monthName = new Date(CURRENT_YEAR, CURRENT_MONTH - 1).toLocaleDateString('en-US', {
    month: 'long',
  })

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Monthly Summary
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {monthName} {CURRENT_YEAR}
          </p>
        </div>
        <Link
          href="/reports"
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          View Full Report
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {data ? (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Pipeline</p>
              <p className="text-xl font-bold text-white">
                {data.executiveSummary.totalGrantsInPipeline}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ${(data.executiveSummary.totalPipelineValue / 1000).toFixed(0)}K total
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Submitted</p>
              <p className="text-xl font-bold text-white">
                {data.executiveSummary.grantsSubmittedThisMonth}
              </p>
              <p className="text-xs text-slate-500 mt-1">this month</p>
            </div>

            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 mb-1">Awarded</p>
              <p className="text-xl font-bold text-emerald-400">
                {data.executiveSummary.grantsAwardedThisMonth}
              </p>
              <p className="text-xs text-emerald-500/70 mt-1">
                ${(data.executiveSummary.grantsAwardedValue / 1000).toFixed(0)}K value
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-white flex items-center gap-1">
                {data.executiveSummary.winRate.toFixed(0)}%
                {data.executiveSummary.winRate > 0 && (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">this month</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Declined this month</span>
              <span className="text-red-400 font-medium">
                {data.executiveSummary.grantsDeclinedThisMonth}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No data available</p>
        </div>
      )}
    </div>
  )
}
