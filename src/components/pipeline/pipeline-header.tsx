'use client'

import { LayoutGrid, List, Calendar } from 'lucide-react'
import type { ViewMode } from './pipeline-kanban'

// Format currency
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

interface PipelineHeaderProps {
  totalValue: number
  grantCount: number
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function PipelineHeader({
  totalValue,
  grantCount,
  viewMode,
  onViewModeChange,
}: PipelineHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
      {/* Total Pipeline Value */}
      <div className="flex items-baseline gap-3">
        <div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            Total Pipeline Value
          </div>
          <div className="text-3xl font-bold text-white mt-1">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          {grantCount} {grantCount === 1 ? 'grant' : 'grants'}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => onViewModeChange('kanban')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${
              viewMode === 'kanban'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }
          `}
          aria-label="Kanban view"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Kanban</span>
        </button>

        <button
          onClick={() => onViewModeChange('list')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${
              viewMode === 'list'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }
          `}
          aria-label="List view"
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">List</span>
        </button>

        <button
          onClick={() => onViewModeChange('calendar')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${
              viewMode === 'calendar'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }
          `}
          aria-label="Calendar view"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Calendar</span>
        </button>
      </div>
    </div>
  )
}
