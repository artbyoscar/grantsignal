'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import {
  FileDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Mail,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const currentDate = new Date()
const CURRENT_YEAR = currentDate.getFullYear()
const CURRENT_MONTH = currentDate.getMonth() + 1

// Generate years from 2020 to current year + 1
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 + 1 }, (_, i) => 2020 + i)

const STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  RESEARCHING: 'Researching',
  WRITING: 'Writing',
  REVIEW: 'Review',
  SUBMITTED: 'Submitted',
  PENDING: 'Pending',
  AWARDED: 'Awarded',
  TOTAL: 'TOTAL',
}

export function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [showEmailScheduler, setShowEmailScheduler] = useState(false)

  const { data, isLoading, refetch } = api.reports.monthlySummary.useQuery(
    {
      month: selectedMonth,
      year: selectedYear,
    },
    {
      enabled: reportGenerated,
    }
  )

  const handleGenerateReport = () => {
    setReportGenerated(true)
    refetch()
  }

  const handleExportPDF = () => {
    window.print()
  }

  const calculateDaysLeft = (deadline: Date) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDeadlineColor = (daysLeft: number) => {
    if (daysLeft < 7) return 'text-red-400 bg-red-500/10'
    if (daysLeft <= 14) return 'text-amber-400 bg-amber-500/10'
    return 'text-emerald-400 bg-emerald-500/10'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submitted':
        return '📤'
      case 'awarded':
        return '🎉'
      case 'declined':
        return '❌'
      default:
        return '📝'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'submitted':
        return 'Submitted'
      case 'awarded':
        return 'Awarded'
      case 'declined':
        return 'Declined'
      default:
        return 'Updated'
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Selector and Actions */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Date Selectors */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerateReport} disabled={isLoading} className="lg:w-48">
            <Calendar className="w-4 h-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {reportGenerated && (
        <>
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-96" />
              <Skeleton className="h-64" />
            </div>
          ) : data ? (
            <div className="space-y-6" id="report-content">
              {/* Export Actions */}
              <div className="flex gap-3 print:hidden">
                <Button onClick={handleExportPDF} variant="outline">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
                <Button
                  onClick={() => setShowEmailScheduler(!showEmailScheduler)}
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Schedule Email
                </Button>
              </div>

              {/* Email Scheduler Placeholder */}
              {showEmailScheduler && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 print:hidden">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <h3 className="text-amber-400 font-medium mb-2">
                        Email Scheduling - Coming Soon
                      </h3>
                      <p className="text-slate-300 text-sm">
                        Automatic email delivery of monthly reports is coming in Phase 2. For now,
                        you can export reports as PDF and share them manually.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Header (for print) */}
              <div className="hidden print:block mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Monthly Summary Report</h1>
                <p className="text-slate-600">
                  {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Generated on {formatDate(new Date())}
                </p>
              </div>

              {/* a) Executive Summary Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-slate-700 rounded-lg p-6 print:border print:border-slate-300 print:bg-white">
                <h2 className="text-xl font-semibold text-white mb-6 print:text-slate-900">
                  Executive Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-sm text-slate-400 mb-1 print:text-slate-600">
                      Total Grants in Pipeline
                    </p>
                    <p className="text-2xl font-bold text-white print:text-slate-900">
                      {data.executiveSummary.totalGrantsInPipeline}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-sm text-slate-400 mb-1 print:text-slate-600">
                      Total Pipeline Value
                    </p>
                    <p className="text-2xl font-bold text-white print:text-slate-900">
                      ${data.executiveSummary.totalPipelineValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-sm text-slate-400 mb-1 print:text-slate-600">
                      Grants Submitted This Month
                    </p>
                    <p className="text-2xl font-bold text-white print:text-slate-900">
                      {data.executiveSummary.grantsSubmittedThisMonth}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-sm text-slate-400 mb-1 print:text-slate-600">
                      Grants Awarded This Month
                    </p>
                    <p className="text-2xl font-bold text-white print:text-slate-900">
                      {data.executiveSummary.grantsAwardedThisMonth}
                      <span className="text-base ml-2 text-emerald-400 print:text-emerald-600">
                        (${data.executiveSummary.grantsAwardedValue.toLocaleString()})
                      </span>
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-sm text-slate-400 mb-1 print:text-slate-600">
                      Grants Declined This Month
                    </p>
                    <p className="text-2xl font-bold text-white print:text-slate-900">
                      {data.executiveSummary.grantsDeclinedThisMonth}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-sm text-slate-400 mb-1 print:text-slate-600">
                      Win Rate This Month
                    </p>
                    <p className="text-2xl font-bold text-white flex items-center print:text-slate-900">
                      {data.executiveSummary.winRate.toFixed(0)}%
                      {data.executiveSummary.winRate >= 50 ? (
                        <TrendingUp className="w-5 h-5 ml-2 text-emerald-400 print:text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 ml-2 text-red-400 print:text-red-600" />
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* b) Pipeline by Status Table */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 print:border print:border-slate-300 print:bg-white">
                <h2 className="text-xl font-semibold text-white mb-4 print:text-slate-900">
                  Pipeline by Status
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 print:border-slate-300">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                          Count
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                          Total Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pipelineByStatus.map((item) => (
                        <tr
                          key={item.status}
                          className={`border-b border-slate-700/50 print:border-slate-200 ${
                            item.status === 'TOTAL'
                              ? 'bg-slate-700/30 font-semibold print:bg-slate-100'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-white print:text-slate-900">
                            {STATUS_LABELS[item.status] || item.status}
                          </td>
                          <td className="py-3 px-4 text-right text-white print:text-slate-900">
                            {item.count}
                          </td>
                          <td className="py-3 px-4 text-right text-white print:text-slate-900">
                            ${item.totalValue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* c) Upcoming Deadlines */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 print:border print:border-slate-300 print:bg-white">
                <h2 className="text-xl font-semibold text-white mb-4 print:text-slate-900">
                  Upcoming Deadlines (Next 30 Days)
                </h2>
                {data.upcomingDeadlines.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 print:border-slate-300">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Grant
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Funder
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Deadline
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Days Left
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.upcomingDeadlines.map((grant) => {
                          const daysLeft = calculateDaysLeft(grant.deadline!)
                          return (
                            <tr
                              key={grant.id}
                              className="border-b border-slate-700/50 print:border-slate-200"
                            >
                              <td className="py-3 px-4 text-white print:text-slate-900">
                                {grant.opportunity?.title || 'Untitled Grant'}
                              </td>
                              <td className="py-3 px-4 text-slate-300 print:text-slate-600">
                                {grant.funder?.name || 'Unknown'}
                              </td>
                              <td className="py-3 px-4 text-slate-300 print:text-slate-600">
                                {formatDate(grant.deadline!)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-sm font-medium ${getDeadlineColor(
                                    daysLeft
                                  )} print:border print:border-current`}
                                >
                                  {daysLeft} days
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 print:text-slate-600">
                                {STATUS_LABELS[grant.status] || grant.status}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3 print:text-slate-400" />
                    <p className="text-slate-400 print:text-slate-600">
                      No upcoming deadlines in the next 30 days
                    </p>
                  </div>
                )}
              </div>

              {/* d) Recent Activity */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 print:border print:border-slate-300 print:bg-white">
                <h2 className="text-xl font-semibold text-white mb-4 print:text-slate-900">
                  Recent Activity
                </h2>
                {data.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentActivity.map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg print:bg-slate-50 print:border print:border-slate-200"
                      >
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-white font-medium print:text-slate-900">
                                {activity.grant.opportunity?.title ||
                                  activity.grant.funder?.name ||
                                  'Untitled Grant'}
                              </p>
                              <p className="text-sm text-slate-400 print:text-slate-600">
                                {getActivityLabel(activity.type)} •{' '}
                                {activity.grant.funder?.name || 'Unknown Funder'}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap print:text-slate-600">
                              {formatDate(activity.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3 print:text-slate-400" />
                    <p className="text-slate-400 print:text-slate-600">
                      No activity recorded for this month
                    </p>
                  </div>
                )}
              </div>

              {/* e) By Program Breakdown */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 print:border print:border-slate-300 print:bg-white">
                <h2 className="text-xl font-semibold text-white mb-4 print:text-slate-900">
                  By Program Breakdown
                </h2>
                {data.byProgram.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 print:border-slate-300">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Program
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Active
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Submitted
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Awarded
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-300 print:text-slate-700">
                            Declined
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byProgram.map((program) => (
                          <tr
                            key={program.programId || 'no-program'}
                            className="border-b border-slate-700/50 print:border-slate-200"
                          >
                            <td className="py-3 px-4 text-white print:text-slate-900">
                              {program.programName}
                            </td>
                            <td className="py-3 px-4 text-right text-white print:text-slate-900">
                              {program.active}
                            </td>
                            <td className="py-3 px-4 text-right text-white print:text-slate-900">
                              {program.submitted}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-400 print:text-emerald-600">
                              {program.awarded}
                            </td>
                            <td className="py-3 px-4 text-right text-red-400 print:text-red-600">
                              {program.declined}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 print:text-slate-600">No programs defined yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Initial State */}
      {!reportGenerated && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Ready to Generate Report</h3>
          <p className="text-slate-400">
            Select a month and year above, then click Generate Report to view the monthly summary
          </p>
        </div>
      )}

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }

          body {
            background: white !important;
            color: black !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .print\\:border {
            border-width: 1px !important;
          }

          .print\\:bg-white {
            background-color: white !important;
          }

          .print\\:text-slate-900 {
            color: rgb(15, 23, 42) !important;
          }

          .print\\:text-slate-700 {
            color: rgb(51, 65, 85) !important;
          }

          .print\\:text-slate-600 {
            color: rgb(71, 85, 105) !important;
          }

          /* Break pages appropriately */
          h2 {
            page-break-after: avoid;
          }

          table {
            page-break-inside: avoid;
          }

          /* Ensure proper spacing */
          .space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}
