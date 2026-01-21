'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { api } from '@/lib/trpc/client'
import {
  FileDown,
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Clock,
  Copy,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// Dynamically import PDF component to avoid SSR issues
const ExecutiveSummaryPDFExport = dynamic(
  () => import('./executive-summary-pdf').then((mod) => mod.ExecutiveSummaryPDFExport),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="bg-blue-600 hover:bg-blue-700">
        <Download className="w-4 h-4 mr-2" />
        Loading PDF...
      </Button>
    ),
  }
)

interface ExecutiveSummaryProps {
  dateRange: {
    startDate: string
    endDate: string
  }
}

const STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  RESEARCHING: 'Researching',
  WRITING: 'Writing',
  REVIEW: 'Review',
  SUBMITTED: 'Submitted',
  PENDING: 'Pending',
  AWARDED: 'Awarded',
}

const STATUS_COLORS: Record<string, string> = {
  PROSPECT: 'bg-slate-500/10 text-slate-400 border-slate-700',
  RESEARCHING: 'bg-blue-500/10 text-blue-400 border-blue-700',
  WRITING: 'bg-purple-500/10 text-purple-400 border-purple-700',
  REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-700',
  SUBMITTED: 'bg-cyan-500/10 text-cyan-400 border-cyan-700',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-700',
  AWARDED: 'bg-emerald-500/10 text-emerald-400 border-emerald-700',
}

export function ExecutiveSummary({ dateRange }: ExecutiveSummaryProps) {
  const [showPreview, setShowPreview] = useState(false)

  const { data, isLoading, refetch } = api.reports.getExecutiveSummary.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      enabled: true,
    }
  )

  const handleGenerateReport = () => {
    setShowPreview(true)
    refetch()
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleCopyToClipboard = () => {
    // Create a text version of the report
    if (!data) return

    const text = `
EXECUTIVE SUMMARY REPORT
${data.organizationName}
Period: ${formatDate(new Date(dateRange.startDate))} - ${formatDate(new Date(dateRange.endDate))}

KEY METRICS
- Total Submitted: ${data.keyMetrics.totalSubmitted}
- Total Awarded: ${data.keyMetrics.totalAwarded}
- Win Rate: ${data.keyMetrics.winRate}%
- Total Requested: $${formatCurrency(data.keyMetrics.totalRequested)}
- Total Awarded: $${formatCurrency(data.keyMetrics.totalAwarded)}

PIPELINE OVERVIEW
${data.pipelineOverview.map((p) => `- ${STATUS_LABELS[p.status]}: ${p.count} grants ($${formatCurrency(p.totalValue)})`).join('\n')}

RECENT WINS
${data.recentWins.map((w) => `- ${w.funderName}: $${formatCurrency(w.amount)} (${formatDate(new Date(w.awardedAt || ''))})`).join('\n')}

UPCOMING DEADLINES
${data.upcomingDeadlines.map((d) => `- ${d.funderName}: ${formatDate(new Date(d.deadline || ''))} - $${formatCurrency(d.amountRequested)}`).join('\n')}
    `.trim()

    navigator.clipboard.writeText(text)
    alert('Report copied to clipboard!')
  }

  const formatCurrency = (value: number) => {
    return (value / 1000000).toFixed(2) + 'M'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400">No data available for the selected date range.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-300">
              {formatDate(new Date(dateRange.startDate))} - {formatDate(new Date(dateRange.endDate))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyToClipboard}
              variant="outline"
              className="bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <ExecutiveSummaryPDFExport data={data} />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white text-slate-900 rounded-lg p-8 print:p-0">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Executive Summary Report</h1>
              <p className="text-lg text-slate-600">{data.organizationName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Report Period</p>
              <p className="text-sm font-semibold">
                {formatDate(new Date(dateRange.startDate))} - {formatDate(new Date(dateRange.endDate))}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Total Submitted</p>
              <p className="text-2xl font-bold">{data.keyMetrics.totalSubmitted}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Total Awarded</p>
              <p className="text-2xl font-bold">{data.keyMetrics.totalAwarded}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm text-emerald-700 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-emerald-700">{data.keyMetrics.winRate}%</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">Total Requested</p>
              <p className="text-2xl font-bold text-blue-700">${formatCurrency(data.keyMetrics.totalRequested)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700 mb-1">Total Awarded</p>
              <p className="text-2xl font-bold text-purple-700">${formatCurrency(data.keyMetrics.totalAwarded)}</p>
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Pipeline Overview</h2>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-sm font-semibold text-slate-700">Stage</th>
                  <th className="text-right py-2 text-sm font-semibold text-slate-700">Count</th>
                  <th className="text-right py-2 text-sm font-semibold text-slate-700">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {data.pipelineOverview.filter(p => p.count > 0).map((pipeline) => (
                  <tr key={pipeline.status} className="border-b border-slate-100 last:border-0">
                    <td className="py-3">
                      <span className="text-sm font-medium">{STATUS_LABELS[pipeline.status]}</span>
                    </td>
                    <td className="text-right py-3 text-sm">{pipeline.count}</td>
                    <td className="text-right py-3 text-sm font-semibold">
                      ${formatCurrency(pipeline.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recent Wins */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Wins</h2>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              {data.recentWins.length > 0 ? (
                <div className="space-y-3">
                  {data.recentWins.map((win, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{win.funderName}</p>
                        <p className="text-xs text-slate-600">
                          {win.programName || 'No program'} • {formatDate(new Date(win.awardedAt || ''))}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-emerald-700">${formatCurrency(win.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No awards in this period</p>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <h2 className="text-xl font-bold mb-4">Upcoming Deadlines</h2>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              {data.upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingDeadlines.slice(0, 5).map((deadline, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{deadline.funderName}</p>
                        <p className="text-xs text-slate-600">
                          {formatDate(new Date(deadline.deadline || ''))} • {STATUS_LABELS[deadline.status]}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-amber-700">${formatCurrency(deadline.amountRequested)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>

        {/* Program Performance */}
        {data.programPerformance.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Program Performance</h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-sm font-semibold text-slate-700">Program</th>
                    <th className="text-right py-2 text-sm font-semibold text-slate-700">Submitted</th>
                    <th className="text-right py-2 text-sm font-semibold text-slate-700">Awarded</th>
                    <th className="text-right py-2 text-sm font-semibold text-slate-700">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.programPerformance.map((program) => (
                    <tr key={program.programId} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 text-sm">{program.programName}</td>
                      <td className="text-right py-3 text-sm">{program.submitted}</td>
                      <td className="text-right py-3 text-sm">{program.awarded}</td>
                      <td className="text-right py-3 text-sm font-semibold text-emerald-700">
                        {program.successRate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Generated by GrantSignal • {formatDate(new Date())}
          </p>
        </div>
      </div>
    </div>
  )
}
