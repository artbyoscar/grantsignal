'use client'

import { useState } from 'react'
import { FileText, Target, Award, ClipboardList, CheckSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/trpc/client'
import { DateRangeSelector } from '@/components/reports/date-range-selector'
import { ExportButtons } from '@/components/reports/export-buttons'
import { WinRateChart } from '@/components/reports/win-rate-chart'
import { FundingByProgramChart } from '@/components/reports/funding-by-program-chart'
import { PipelineFunnel } from '@/components/reports/pipeline-funnel'
import { TopFundersChart } from '@/components/reports/top-funders-chart'
import { YoYComparisonChart } from '@/components/reports/yoy-comparison-chart'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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

  const funnelStages = pipelineData?.slice(0, 4).map((stage) => ({
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
  })) || []

  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

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
                <button className="mt-auto w-full px-2 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded transition">
                  Generate
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
    </div>
  )
}
