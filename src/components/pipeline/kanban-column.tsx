'use client'

import { useDroppable } from '@dnd-kit/core'
import { Minus, Plus } from 'lucide-react'
import type { PipelineCardProps } from './pipeline-card'

// Stage color mapping based on mockup
const stageColors: Record<string, { dot: string; border: string; bg: string; headerBg: string }> = {
  prospect: {
    dot: 'bg-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    headerBg: 'bg-amber-500/10',
  },
  researching: {
    dot: 'bg-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    headerBg: 'bg-blue-500/10',
  },
  writing: {
    dot: 'bg-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    headerBg: 'bg-purple-500/10',
  },
  review: {
    dot: 'bg-orange-400',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
    headerBg: 'bg-orange-500/15', // More prominent
  },
  submitted: {
    dot: 'bg-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/5',
    headerBg: 'bg-indigo-500/10',
  },
  pending: {
    dot: 'bg-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/5',
    headerBg: 'bg-orange-500/10',
  },
  awarded: {
    dot: 'bg-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    headerBg: 'bg-green-500/10',
  },
}

export interface KanbanColumnProps {
  id: string
  label: string
  count: number
  color: string
  description?: string
  isCollapsed?: boolean
  onToggleCollapse: () => void
  children?: React.ReactNode
}

export function KanbanColumn({
  id,
  label,
  count,
  color,
  description,
  isCollapsed = false,
  onToggleCollapse,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  // Get color classes, fallback to slate if color not found
  const colorKey = color.toLowerCase()
  const classes = stageColors[colorKey] || {
    dot: 'bg-slate-400',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/5',
    headerBg: 'bg-slate-500/10',
  }

  // Collapsed state - minimal width with vertical title
  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 flex flex-col max-h-full">
        {/* Collapsed Header */}
        <div
          className={`
            flex items-center justify-center px-1 py-2 rounded-t-xl
            ${classes.border} ${classes.headerBg} backdrop-blur-sm
          `}
        >
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Expand column"
          >
            <Plus className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Collapsed Content - Vertical Title */}
        <div
          ref={setNodeRef}
          className={`
            flex-1 flex items-center justify-center p-2 rounded-b-xl border-b border-x
            ${classes.border}
            ${isOver ? `${classes.bg} border-2 border-dashed border-blue-500` : 'bg-slate-900/30'}
            transition-all duration-200
          `}
        >
          <span
            className="text-xs font-semibold text-slate-300 whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {label}
          </span>
        </div>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="w-[300px] shrink-0 flex flex-col max-h-full">
      {/* Column Header */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 rounded-t-xl
          ${classes.border} ${classes.headerBg} backdrop-blur-sm
        `}
      >
        {/* Left: Colored Dot + Title + Count Badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${classes.dot}`} />
          <h3 className="text-sm font-semibold text-white truncate">{label}</h3>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-700/50 text-slate-300">
            {count}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Collapse column"
          >
            <Minus className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Card Container with Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto space-y-3 p-2 rounded-b-xl border-b border-x
          ${classes.border}
          ${isOver ? `${classes.bg} border-2 border-dashed border-blue-500` : 'bg-slate-900/30'}
          transition-all duration-200
        `}
      >
        {children}
      </div>
    </div>
  )
}
