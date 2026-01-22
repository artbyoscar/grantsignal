'use client'

import { useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { GrantStatus } from '@/types/client-types'

type ColorType = 'slate' | 'purple' | 'blue' | 'amber' | 'cyan' | 'orange' | 'green' | 'red'

const colorClasses: Record<ColorType, { dot: string; border: string; bg: string; text: string }> = {
  slate: {
    dot: 'bg-slate-500',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
  },
  purple: {
    dot: 'bg-purple-500',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
  },
  blue: {
    dot: 'bg-blue-500',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
  },
  amber: {
    dot: 'bg-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  cyan: {
    dot: 'bg-cyan-500',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
  },
  orange: {
    dot: 'bg-orange-500',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
  },
  green: {
    dot: 'bg-green-500',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
  },
  red: {
    dot: 'bg-red-500',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
  },
}

interface KanbanColumnProps {
  id: GrantStatus
  label: string
  color: ColorType
  description: string
  count: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  label,
  color,
  description,
  count,
  isCollapsed,
  onToggleCollapse,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const classes = colorClasses[color]

  return (
    <div
      className={`flex flex-col w-80 flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-300`}
    >
      {/* Column Header */}
      <div
        className={`
          flex items-center justify-between p-3 rounded-t-lg border-t border-x
          ${classes.border} ${classes.bg} backdrop-blur-sm
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${classes.dot}`} />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate">{label}</h3>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${classes.bg} ${classes.text}`}
                >
                  {count}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{description}</p>
            </div>
          )}
        </div>

        {/* Collapse/Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          aria-label={isCollapsed ? 'Expand column' : 'Collapse column'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`
            flex-1 p-3 rounded-b-lg border-b border-x overflow-y-auto
            ${classes.border}
            ${isOver ? `${classes.bg} border-2` : 'bg-slate-900/30 border-slate-700/50'}
            transition-all duration-200
          `}
        >
          {children}
        </div>
      )}

      {/* Collapsed state - show count vertically */}
      {isCollapsed && (
        <div
          ref={setNodeRef}
          className={`
            flex-1 flex flex-col items-center justify-center p-2 rounded-b-lg border-b border-x
            ${classes.border}
            ${isOver ? `${classes.bg} border-2` : 'bg-slate-900/30 border-slate-700/50'}
            transition-all duration-200
          `}
        >
          <span
            className={`writing-mode-vertical text-xs font-semibold ${classes.text}`}
            style={{ writingMode: 'vertical-rl' }}
          >
            {count}
          </span>
        </div>
      )}
    </div>
  )
}
