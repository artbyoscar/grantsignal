'use client'

import { useState } from 'react'
import { FileText, Target, Award, ClipboardList, CheckSquare, BarChart3, Download, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/trpc/client'
import { DateRangeSelector } from '@/components/reports/date-range-selector'
import { ExportButtons } from '@/components/reports/export-buttons'
import { WinRateChart } from '@/components/reports/win-rate-chart'
import { FundingByProgramChart } from '@/components/reports/funding-by-program-chart'
import { PipelineFunnel } from '@/components/reports/pipeline-funnel'
import { TopFundersChart } from '@/components/reports/top-funders-chart'
import { YoYComparisonChart } from '@/components/reports/yoy-comparison-chart'
import { EmptyState } from '@/components/ui/empty-state'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  // Fetch data for report exports
  const { data: executiveSummaryData } = api.reports.getExecutiveSummary.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const { data: pipelineReportData } = api.reports.getPipelineReport.useQuery()

  const { data: winLossAnalysisData } = api.reports.getWinLossAnalysis.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const { data: topFundersReportData } = api.reports.getTopFunders.useQuery({
    limit: 50,
  })

  // Fetch chart data
  const { data: winRateData, isLoading: winRateLoading } = api.reports.getWinRateData.useQuery({
    months: 12,
  })

  const { data: fundingByProgramRawData, isLoading: fundingLoading } = api.reports.getFundingByProgram.useQuery()

  const { data: pipelineData, isLoading: pipelineLoading } = api.reports.getPipelineByStage.useQuery()

  const { data: topFundersData, isLoading: fundersLoading } = api.reports.getTopFunders.useQuery({
    limit: 10,
  })

  const { data: yoyData, isLoading: yoyLoading } = api.reports.getYoYComparison.useQuery()

  // Transform data for components
  const winRateChartData = winRateData?.map((d) => ({
    month: new Date(d.month).toLocaleDateString('en-US', { month: 'short' }),
    rate: d.rate,
  })) || []

  // Show all pipeline stages (matching Pipeline Kanban)
  const funnelStages = pipelineData?.map((stage) => ({
    name: stage.name,
    value: stage.value,
    count: stage.count,
    color: stage.color,
  })) || []

  const funnelTotal = funnelStages.reduce((sum, stage) => sum + stage.value, 0)

  const topFundersChartData = topFundersData?.map((f) => ({
    name: f.name,
    amount: f.totalAwarded,
  })) || []

  const yoyChartData = yoyData?.map((d) => ({
    category: d.quarter,
    currentYear: d.currentYear.amount,
    previousYear: d.lastYear.amount,
    currentYearCount: d.currentYear.count,
    previousYearCount: d.lastYear.count,
    currentYearWinRate: d.currentYear.winRate,
    previousYearWinRate: d.lastYear.winRate,
  })) || []

  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  // Helper function to generate and download CSV
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Helper function to escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Generate Executive Summary CSV
  const handleExecutiveReport = async () => {
    if (!executiveSummaryData) return
    setGeneratingReport('executive')

    try {
      const data = executiveSummaryData
      const rows: string[] = []

      rows.push('EXECUTIVE SUMMARY REPORT')
      rows.push(`Organization,${escapeCSV(data.organizationName)}`)
      rows.push(`Report Date,${new Date().toLocaleDateString()}`)
      rows.push(`Date Range,"${dateRange.startDate} to ${dateRange.endDate}"`)
      rows.push('')

      rows.push('KEY METRICS')
      rows.push(`Total Submitted,${data.keyMetrics.totalSubmitted}`)
      rows.push(`Win Rate,${data.keyMetrics.winRate}%`)
      rows.push(`Total Requested,$${(data.keyMetrics.totalRequested || 0).toLocaleString()}`)
      rows.push(`Total Awarded,$${(data.keyMetrics.totalAwarded || 0).toLocaleString()}`)
      rows.push('')

      rows.push('PIPELINE OVERVIEW')
      rows.push('Status,Count,Total Value')
      data.pipelineOverview.forEach((p) => {
        rows.push(`${p.status},${p.count},$${(p.totalValue || 0).toLocaleString()}`)
      })
      rows.push('')

      rows.push('PROGRAM PERFORMANCE')
      rows.push('Program,Submitted,Awarded,Success Rate')
      data.programPerformance.forEach((p) => {
        rows.push(`${escapeCSV(p.programName)},${p.submitted},${p.awarded},${p.successRate.toFixed(1)}%`)
      })
      rows.push('')

      rows.push('RECENT WINS')
      rows.push('Funder,Amount,Date,Program')
      data.recentWins.forEach((w) => {
        rows.push(`${escapeCSV(w.funderName)},$${(w.amount || 0).toLocaleString()},${w.awardedAt ? new Date(w.awardedAt).toLocaleDateString() : ''},${escapeCSV(w.programName || '')}`)
      })
      rows.push('')

      rows.push('UPCOMING DEADLINES')
      rows.push('Funder,Amount Requested,Deadline,Status')
      data.upcomingDeadlines.forEach((d) => {
        rows.push(`${escapeCSV(d.funderName)},$${(d.amountRequested || 0).toLocaleString()},${new Date(d.deadline).toLocaleDateString()},${d.status}`)
      })

      const csvContent = rows.join('\n')
      const filename = `executive-summary-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(filename, csvContent)
    } finally {
      setGeneratingReport(null)
    }
  }

  // Generate Pipeline Report CSV
  const handlePipelineReport = async () => {
    if (!pipelineReportData) return
    setGeneratingReport('pipeline')

    try {
      const data = pipelineReportData
      const rows: string[] = []

      rows.push('PIPELINE REPORT')
      rows.push(`Report Date,${new Date().toLocaleDateString()}`)
      rows.push(`Total Grants,${data.totalGrants}`)
      rows.push(`Total Pipeline Value,$${(data.totalValue || 0).toLocaleString()}`)
      rows.push('')

      data.statusGroups.forEach((group) => {
        rows.push(`${group.status} (${group.count} grants, $${(group.totalValue || 0).toLocaleString()})`)
        rows.push('Funder,Funder Type,Program,Amount,Deadline,Status')

        group.grants.forEach((g) => {
          rows.push(
            `${escapeCSV(g.funderName)},${g.funderType || ''},${escapeCSV(g.programName || '')},` +
            `$${(g.amount || 0).toLocaleString()},${g.deadline ? new Date(g.deadline).toLocaleDateString() : ''},${group.status}`
          )
        })
        rows.push('')
      })

      const csvContent = rows.join('\n')
      const filename = `pipeline-report-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(filename, csvContent)
    } finally {
      setGeneratingReport(null)
    }
  }

  // Generate Historical (Win/Loss Analysis) CSV
  const handleHistoricalReport = async () => {
    if (!winLossAnalysisData) return
    setGeneratingReport('historical')

    try {
      const data = winLossAnalysisData
      const rows: string[] = []

      rows.push('WIN/LOSS ANALYSIS REPORT')
      rows.push(`Report Date,${new Date().toLocaleDateString()}`)
      rows.push(`Date Range,"${dateRange.startDate} to ${dateRange.endDate}"`)
      rows.push('')

      rows.push('OVERALL METRICS')
      rows.push(`Total Awarded,${data.overallMetrics.totalAwarded}`)
      rows.push(`Total Declined,${data.overallMetrics.totalDeclined}`)
      rows.push(`Win Rate,${data.overallMetrics.winRate}%`)
      rows.push(`Total Amount Awarded,$${(data.overallMetrics.totalAmountAwarded || 0).toLocaleString()}`)
      rows.push('')

      rows.push('BY FUNDER TYPE')
      rows.push('Funder Type,Awarded,Declined,Success Rate,Total Amount')
      data.byFunderType.forEach((ft) => {
        rows.push(
          `${ft.funderType},${ft.awarded},${ft.declined},${ft.successRate}%,` +
          `$${(ft.totalAmount || 0).toLocaleString()}`
        )
      })
      rows.push('')

      rows.push('BY PROGRAM')
      rows.push('Program,Awarded,Declined,Success Rate,Total Amount')
      data.byProgram.forEach((p) => {
        rows.push(
          `${escapeCSV(p.programName)},${p.awarded},${p.declined},${p.successRate}%,` +
          `$${(p.totalAmount || 0).toLocaleString()}`
        )
      })

      const csvContent = rows.join('\n')
      const filename = `historical-analysis-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(filename, csvContent)
    } finally {
      setGeneratingReport(null)
    }
  }

  // Generate Funder Report CSV
  const handleFunderReport = async () => {
    if (!topFundersReportData) return
    setGeneratingReport('funder')

    try {
      const data = topFundersReportData
      const rows: string[] = []

      rows.push('TOP FUNDERS REPORT')
      rows.push(`Report Date,${new Date().toLocaleDateString()}`)
      rows.push('')

      rows.push('TOP FUNDERS')
      rows.push('Rank,Funder Name,Funder Type,Total Awarded,Grant Count,Average Award')
      data.forEach((funder, index) => {
        const avgAward = funder.grantCount > 0 ? (funder.totalAwarded || 0) / funder.grantCount : 0
        rows.push(
          `${index + 1},${escapeCSV(funder.name)},${funder.type || ''},$${(funder.totalAwarded || 0).toLocaleString()},` +
          `${funder.grantCount},$${avgAward.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
        )
      })

      const csvContent = rows.join('\n')
      const filename = `funder-report-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(filename, csvContent)
    } finally {
      setGeneratingReport(null)
    }
  }

  // Check if we have any data
  const isLoading = winRateLoading || fundingLoading || pipelineLoading || fundersLoading || yoyLoading
  const hasNoData = !isLoading && (
    funnelStages.length === 0 ||
    funnelStages.every(stage => stage.count === 0)
  )

  // Report type cards
  const reportTypes = [
    {
      id: 'executive',
      title: 'Executive',
      description: 'One-page overview',
      icon: FileText,
    },
    {
      id: 'pipeline',
      title: 'Pipeline',
      description: 'All grants by status',
      icon: ClipboardList,
    },
    {
      id: 'historical',
      title: 'Historical',
      description: 'Trends over time',
      icon: Target,
    },
    {
      id: 'funder',
      title: 'Funder',
      description: 'Relationship deep dive',
      icon: Award,
    },
    {
      id: 'compliance',
      title: 'Compliance',
      description: 'Reporting requirements',
      icon: CheckSquare,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reports & Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive insights into your grant portfolio performance
          </p>
        </div>
        <div className="lg:flex-shrink-0">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Empty State */}
      {hasNoData ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          description="Add grants and track their progress to generate reports and analytics."
          primaryAction={{
            label: "Go to Pipeline",
            onClick: () => router.push("/pipeline"),
          }}
        />
      ) : (
        <>
          {/* Top Row: Win Rate + Funding Donut (2 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {winRateLoading ? (
          <Skeleton className="h-[200px]" />
        ) : (
          <WinRateChart
            data={winRateChartData}
            dateRange={`${new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
          />
        )}

        {fundingLoading ? (
          <Skeleton className="h-[200px]" />
        ) : (
          <FundingByProgramChart data={fundingByProgramRawData || []} />
        )}
      </div>

      {/* Middle Row: Funnel + Top Funders + YoY (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pipelineLoading ? (
          <Skeleton className="h-[160px]" />
        ) : (
          <PipelineFunnel stages={funnelStages} total={funnelTotal} />
        )}

        {fundersLoading ? (
          <Skeleton className="h-[180px]" />
        ) : (
          <TopFundersChart funders={topFundersChartData} />
        )}

        {yoyLoading ? (
          <Skeleton className="h-[180px]" />
        ) : (
          <YoYComparisonChart
            data={yoyChartData}
            currentYearLabel={currentYear.toString()}
            previousYearLabel={previousYear.toString()}
          />
        )}
      </div>

      {/* Report Types (5 columns) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
        <h2 className="text-sm font-semibold text-white mb-3">Report Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isGenerating = generatingReport === report.id
            let isDisabled = false
            let onClick = () => {}

            if (report.id === 'executive') {
              isDisabled = !executiveSummaryData
              onClick = handleExecutiveReport
            } else if (report.id === 'pipeline') {
              isDisabled = !pipelineReportData
              onClick = handlePipelineReport
            } else if (report.id === 'historical') {
              isDisabled = !winLossAnalysisData
              onClick = handleHistoricalReport
            } else if (report.id === 'funder') {
              isDisabled = !topFundersReportData
              onClick = handleFunderReport
            } else if (report.id === 'compliance') {
              onClick = () => router.push('/compliance')
            }

            return (
              <div
                key={report.id}
                className="flex flex-col p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-center mb-2">
                  <h3 className="text-sm font-semibold text-white mb-0.5">{report.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{report.description}</p>
                </div>
                <button
                  onClick={onClick}
                  disabled={isDisabled || isGenerating}
                  className={`mt-auto w-full px-2 py-1 text-xs font-medium rounded transition-all flex items-center justify-center gap-1 ${
                    isDisabled || isGenerating
                      ? 'text-slate-500 bg-slate-700/30 cursor-not-allowed'
                      : 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                  title={isDisabled ? 'No data available' : undefined}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3" />
                      <span>{report.id === 'compliance' ? 'View' : 'Export'}</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

          {/* Export Buttons */}
          <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-3">
            <span className="text-xs text-slate-400">Export Options</span>
            <ExportButtons />
          </div>
        </>
      )}
    </div>
  )
}
