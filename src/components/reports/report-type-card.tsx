'use client'

import { FileText, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportTypeCardProps {
  title: string
  description: string
  icon?: 'file' | 'download' | 'calendar'
  lastGenerated?: Date
  onGenerate: () => void
  isGenerating?: boolean
}

const iconMap = {
  file: FileText,
  download: Download,
  calendar: Calendar,
}

export function ReportTypeCard({
  title,
  description,
  icon = 'file',
  lastGenerated,
  onGenerate,
  isGenerating = false,
}: ReportTypeCardProps) {
  const Icon = iconMap[icon]

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Icon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {lastGenerated && (
        <div className="mb-4 text-xs text-slate-500">
          Last generated: {lastGenerated.toLocaleDateString()}
        </div>
      )}

      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </Button>
    </div>
  )
}
