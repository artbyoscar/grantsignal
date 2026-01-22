'use client'

interface ReportTypeCardProps {
  title: string
  description: string
  onGenerate: () => void
  isGenerating?: boolean
}

export function ReportTypeCard({
  title,
  description,
  onGenerate,
  isGenerating = false
}: ReportTypeCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col h-full">
      <div className="flex-1 mb-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2">
          {description}
        </p>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  )
}

interface ReportType {
  id: string
  title: string
  description: string
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level overview of key metrics and performance.',
  },
  {
    id: 'pipeline-report',
    title: 'Pipeline Report',
    description: 'Detailed analysis of active opportunities and stages.',
  },
  {
    id: 'historical-analysis',
    title: 'Historical Analysis',
    description: 'Long-term trends and win/loss data.',
  },
  {
    id: 'funder-report',
    title: 'Funder Report',
    description: 'Insights into top funders and giving patterns.',
  },
  {
    id: 'compliance-report',
    title: 'Compliance Report',
    description: 'Grant compliance status and upcoming deadlines.',
  },
]

interface ReportTypeGridProps {
  onGenerateReport?: (reportId: string) => void
  generatingReportId?: string
}

export function ReportTypeGrid({
  onGenerateReport,
  generatingReportId
}: ReportTypeGridProps) {
  const handleGenerate = (reportId: string) => {
    if (onGenerateReport) {
      onGenerateReport(reportId)
    } else {
      console.log(`Generating report: ${reportId}`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {REPORT_TYPES.map((report) => (
        <ReportTypeCard
          key={report.id}
          title={report.title}
          description={report.description}
          onGenerate={() => handleGenerate(report.id)}
          isGenerating={generatingReportId === report.id}
        />
      ))}
    </div>
  )
}
