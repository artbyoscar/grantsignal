'use client'

import { CheckCircle, AlertTriangle, XCircle, Clock, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'
import type { DocumentHealthStats } from '@/types/document-health'

interface DocumentHealthStatsProps {
  stats: DocumentHealthStats
}

export function DocumentHealthStats({ stats }: DocumentHealthStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Overall Health Score */}
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="mb-3">
            <CircularProgress
              value={stats.healthScore}
              size="md"
              showValue
            />
          </div>
          <h3 className="text-sm font-medium text-slate-400 text-center">
            Overall Health Score
          </h3>
          <p className="text-xs text-slate-500 text-center mt-1">
            Based on {stats.total} document{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {/* Total Documents */}
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-slate-400 mt-1">Total Documents</p>
            <p className="text-xs text-slate-500 mt-1">All uploaded</p>
          </div>
        </div>
      </Card>

      {/* Successfully Parsed */}
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-white">{stats.successful}</p>
            <p className="text-sm text-slate-400 mt-1">Successfully Parsed</p>
            <p className="text-xs text-green-400 mt-1">≥ 80% confidence</p>
          </div>
        </div>
      </Card>

      {/* Needs Review */}
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-white">{stats.needsReview}</p>
            <p className="text-sm text-slate-400 mt-1">Needs Review</p>
            <p className="text-xs text-amber-400 mt-1">60-79% confidence</p>
          </div>
        </div>
      </Card>

      {/* Failed/Manual Required */}
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-white">{stats.failed}</p>
            <p className="text-sm text-slate-400 mt-1">Failed/Manual Required</p>
            <p className="text-xs text-red-400 mt-1">&lt; 60% confidence</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
