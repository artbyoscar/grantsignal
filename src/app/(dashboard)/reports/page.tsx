'use client'

import { useState } from 'react'
import { FileText, TrendingUp, Target, Award } from 'lucide-react'
import { MonthlySummary } from '@/components/reports/monthly-summary'

type ReportType = 'monthly' | 'pipeline' | 'winrate' | 'funder' | null

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null)

  const reportCards = [
    {
      id: 'monthly' as const,
      title: 'Monthly Summary',
      description: 'Comprehensive monthly performance report for leadership',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'pipeline' as const,
      title: 'Pipeline Overview',
      description: 'Current state of grant pipeline by status',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      comingSoon: true,
    },
    {
      id: 'winrate' as const,
      title: 'Win Rate Analysis',
      description: 'Historical win rates and trends over time',
      icon: Target,
      color: 'from-emerald-500 to-teal-500',
      comingSoon: true,
    },
    {
      id: 'funder' as const,
      title: 'Funder Performance',
      description: 'Track success rates with specific funders',
      icon: Award,
      color: 'from-orange-500 to-red-500',
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">
          Generate and export reports for leadership and stakeholders
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
