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
  { month: 'Jan', winRate: 45 },
  { month: 'Feb', winRate: 48 },
  { month: 'Mar', winRate: 52 },
  { month: 'Apr', winRate: 50 },
  { month: 'May', winRate: 55 },
  { month: 'Jun', winRate: 58 },
  { month: 'Jul', winRate: 56 },
  { month: 'Aug', winRate: 60 },
  { month: 'Sep', winRate: 62 },
  { month: 'Oct', winRate: 65 },
  { month: 'Nov', winRate: 63 },
  { month: 'Dec', winRate: 67 },
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
  { name: 'Gates Foundation', value: 2500000, count: 8 },
  { name: 'Ford Foundation', value: 1800000, count: 6 },
  { name: 'Rockefeller Foundation', value: 1500000, count: 7 },
  { name: 'MacArthur Foundation', value: 1200000, count: 5 },
  { name: 'Carnegie Corporation', value: 950000, count: 4 },
  { name: 'Kellogg Foundation', value: 850000, count: 6 },
  { name: 'Mellon Foundation', value: 720000, count: 3 },
  { name: 'Hewlett Foundation', value: 680000, count: 4 },
  { name: 'Knight Foundation', value: 520000, count: 3 },
  { name: 'Spencer Foundation', value: 450000, count: 2 },
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
        <WinRateChart data={winRateData} />
        <FundingByProgramChart data={programData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineByStageChart data={stageData} />
        <TopFundersChart data={funderData} />
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
