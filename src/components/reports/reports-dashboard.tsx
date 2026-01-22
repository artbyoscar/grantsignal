'use client'

import { useState } from 'react'
import {
  WinRateChart,
  FundingByProgramChart,
  PipelineByStageChart,
  PipelineFunnel,
  TopFundersChart,
  YoYComparisonChart,
  ReportTypeCard,
} from './index'

// Sample data - replace with real data from tRPC
const sampleWinRateData = [
  { month: 'Jan', rate: 45 },
  { month: 'Feb', rate: 48 },
  { month: 'Mar', rate: 52 },
  { month: 'Apr', rate: 50 },
  { month: 'May', rate: 55 },
  { month: 'Jun', rate: 58 },
  { month: 'Jul', rate: 56 },
  { month: 'Aug', rate: 60 },
  { month: 'Sep', rate: 62 },
  { month: 'Oct', rate: 65 },
  { month: 'Nov', rate: 63 },
  { month: 'Dec', rate: 67 },
]

const sampleProgramData = [
  { name: 'Education', value: 1250000, count: 15 },
  { name: 'Healthcare', value: 980000, count: 12 },
  { name: 'Environment', value: 750000, count: 10 },
  { name: 'Arts & Culture', value: 520000, count: 8 },
  { name: 'Community Dev', value: 450000, count: 7 },
]

const sampleStageData = [
  { stage: 'Discovery', value: 350000, count: 25 },
  { stage: 'Applied', value: 820000, count: 18 },
  { stage: 'Under Review', value: 1200000, count: 15 },
  { stage: 'Awarded', value: 2100000, count: 12 },
  { stage: 'Active', value: 1500000, count: 10 },
]

const sampleFunderData = [
  { name: 'Gates Foundation', amount: 2500000 },
  { name: 'Ford Foundation', amount: 1800000 },
  { name: 'Rockefeller Foundation', amount: 1500000 },
  { name: 'MacArthur Foundation', amount: 1200000 },
  { name: 'Carnegie Corporation', amount: 950000 },
  { name: 'Kellogg Foundation', amount: 850000 },
  { name: 'Mellon Foundation', amount: 720000 },
  { name: 'Hewlett Foundation', amount: 680000 },
  { name: 'Knight Foundation', amount: 520000 },
  { name: 'Spencer Foundation', amount: 450000 },
]

const sampleYoYData = [
  { category: 'Q1', currentYear: 1250000, previousYear: 980000 },
  { category: 'Q2', currentYear: 1450000, previousYear: 1100000 },
  { category: 'Q3', currentYear: 1680000, previousYear: 1250000 },
  { category: 'Q4', currentYear: 1850000, previousYear: 1420000 },
]

const sampleFunnelData = {
  stages: [
    { name: 'Prospect', value: 2500000, count: 24, color: '#f59e0b' },
    { name: 'Researching', value: 1800000, count: 18, color: '#3b82f6' },
    { name: 'Writing', value: 1200000, count: 12, color: '#8b5cf6' },
    { name: 'Submitted', value: 800000, count: 8, color: '#6366f1' },
  ],
  total: 6300000,
}

interface ReportsDashboardProps {
  // Add props for real data when available
  winRateData?: typeof sampleWinRateData
  programData?: typeof sampleProgramData
  stageData?: typeof sampleStageData
  funnelData?: typeof sampleFunnelData
  funderData?: typeof sampleFunderData
  yoyData?: typeof sampleYoYData
}

export function ReportsDashboard({
  winRateData = sampleWinRateData,
  programData = sampleProgramData,
  stageData = sampleStageData,
  funnelData = sampleFunnelData,
  funderData = sampleFunderData,
  yoyData = sampleYoYData,
}: ReportsDashboardProps) {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  const handleGenerateReport = async (reportType: string) => {
    setGeneratingReport(reportType)
    // TODO: Implement report generation logic
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGeneratingReport(null)
  }

  return (
    <div className="space-y-6">
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WinRateChart data={winRateData} dateRange="Jan 2024 - Dec 2024" />
        <FundingByProgramChart data={programData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineByStageChart data={stageData} />
        <TopFundersChart funders={funderData} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PipelineFunnel stages={funnelData.stages} total={funnelData.total} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <YoYComparisonChart
          data={yoyData}
          currentYearLabel="2024"
          previousYearLabel="2023"
        />
      </div>

      {/* Report Generation Cards */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Generate Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportTypeCard
            title="Annual Report"
            description="Comprehensive funding summary for the year"
            icon="file"
            lastGenerated={new Date('2024-01-15')}
            onGenerate={() => handleGenerateReport('annual')}
            isGenerating={generatingReport === 'annual'}
          />
          <ReportTypeCard
            title="Quarterly Summary"
            description="Q4 2024 grants and outcomes"
            icon="calendar"
            lastGenerated={new Date('2024-10-01')}
            onGenerate={() => handleGenerateReport('quarterly')}
            isGenerating={generatingReport === 'quarterly'}
          />
          <ReportTypeCard
            title="Program Analysis"
            description="Detailed breakdown by program area"
            icon="download"
            lastGenerated={new Date('2024-09-15')}
            onGenerate={() => handleGenerateReport('program')}
            isGenerating={generatingReport === 'program'}
          />
          <ReportTypeCard
            title="Funder Report"
            description="Engagement and success metrics by funder"
            icon="file"
            onGenerate={() => handleGenerateReport('funder')}
            isGenerating={generatingReport === 'funder'}
          />
          <ReportTypeCard
            title="Win/Loss Analysis"
            description="Success factors and improvement areas"
            icon="download"
            onGenerate={() => handleGenerateReport('winloss')}
            isGenerating={generatingReport === 'winloss'}
          />
          <ReportTypeCard
            title="Custom Report"
            description="Build a custom report with selected metrics"
            icon="calendar"
            onGenerate={() => handleGenerateReport('custom')}
            isGenerating={generatingReport === 'custom'}
          />
        </div>
      </div>
    </div>
  )
}
