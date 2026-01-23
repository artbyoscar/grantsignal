'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Flag } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GrantStatus, type Grant } from '@/types/client-types'
import { cn } from '@/lib/utils'

type ColorType = 'slate' | 'purple' | 'blue' | 'amber' | 'cyan' | 'orange' | 'green' | 'red'

const colorClasses: Record<ColorType, { dot: string; border: string; bg: string; borderLeft: string }> = {
  slate: { dot: 'bg-slate-500', border: 'border-slate-500/30', bg: 'bg-slate-500/10', borderLeft: 'border-l-slate-600' },
  purple: { dot: 'bg-purple-500', border: 'border-purple-500/30', bg: 'bg-purple-500/10', borderLeft: 'border-l-purple-700' },
  blue: { dot: 'bg-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500/10', borderLeft: 'border-l-blue-700' },
  amber: { dot: 'bg-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10', borderLeft: 'border-l-amber-700' },
  cyan: { dot: 'bg-cyan-500', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', borderLeft: 'border-l-cyan-700' },
  orange: { dot: 'bg-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/10', borderLeft: 'border-l-orange-700' },
  green: { dot: 'bg-green-500', border: 'border-green-500/30', bg: 'bg-green-500/10', borderLeft: 'border-l-emerald-700' },
  red: { dot: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10', borderLeft: 'border-l-red-700' },
}

// Format currency
function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Calculate days remaining and get color
function getDeadlineInfo(deadline: Date | null | undefined): { text: string; color: string } | null {
  if (!deadline) return null

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let color = 'text-slate-400'
  if (daysRemaining < 0) {
    color = 'text-red-400'
  } else if (daysRemaining < 7) {
    color = 'text-red-400'
  } else if (daysRemaining <= 14) {
    color = 'text-amber-400'
  } else {
    color = 'text-green-400'
  }

  const text = daysRemaining < 0
    ? `${Math.abs(daysRemaining)} days overdue`
    : `${daysRemaining} days left`

  return { text, color }
}

// Get fit score badge color
function getFitScoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (score >= 70) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  if (score >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

// Get initials from display name
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface DraggableGrantCardProps {
  grant: Grant
  color: ColorType
  progress?: number // Optional progress for Writing stage (0-100)
  isFlagged?: boolean // Optional priority flag
  logoUrl?: string | null // Optional funder logo URL
}

export function DraggableGrantCard({ grant, color, progress, isFlagged = false, logoUrl }: DraggableGrantCardProps) {
  const router = useRouter()
  const [pointerDown, setPointerDown] = useState<{ time: number; x: number; y: number } | null>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: grant.id,
  })

  const classes = colorClasses[color]
  const deadlineInfo = getDeadlineInfo(grant.opportunity?.deadline || grant.deadline)
  const fitScore = (grant.opportunity as any)?.fitScores?.[0]
  const isWritingStage = grant.status === GrantStatus.WRITING

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  // Handle click vs drag distinction
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPointerDown({ time: Date.now(), x: e.clientX, y: e.clientY })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDown) return

    const timeDiff = Date.now() - pointerDown.time
    const distance = Math.sqrt(
      Math.pow(e.clientX - pointerDown.x, 2) +
      Math.pow(e.clientY - pointerDown.y, 2)
    )

    // If quick click with minimal movement, navigate to writer
    if (timeDiff < 300 && distance < 10 && !isDragging) {
      router.push(`/writer/${grant.id}`)
    }

    setPointerDown(null)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        'group relative w-[260px] p-2.5 rounded-md border border-l-[3px] transition-all duration-200',
        `bg-slate-800 border-slate-700/50 shadow-sm ${classes.borderLeft}`,
        // Cursor states
        isDragging ? 'cursor-grabbing' : 'cursor-pointer hover:cursor-grab',
        // Visual states
        isDragging
          ? 'opacity-60 scale-[1.02] shadow-2xl shadow-blue-500/30 border-blue-400/50 bg-slate-800/40'
          : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 hover:border-slate-600'
      )}
    >
      {/* Priority Flag - Top Left */}
      {isFlagged && (
        <div className="absolute -top-1 -left-1 z-10">
          <Flag className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
        </div>
      )}

      {/* Fit Score Badge - Top Right */}
      {fitScore && (
        <div
          className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded border ${getFitScoreColor(fitScore.overallScore)}`}
          title={`Fit Score: ${fitScore.overallScore}\nMission: ${fitScore.missionScore} | Capacity: ${fitScore.capacityScore}`}
        >
          {fitScore.overallScore}
        </div>
      )}

      {/* Funder logo and name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={grant.funder?.name || 'Funder'}
              className="w-8 h-8 rounded flex-shrink-0 object-cover bg-slate-700"
            />
          ) : (
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${classes.dot}`} />
          )}
          <h4 className="text-xs font-semibold text-slate-200 truncate">
            {grant.funder?.name || 'Unknown Funder'}
          </h4>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
        >
          <MoreHorizontal className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Grant Title */}
      <h3 className="text-[13px] text-slate-300 mb-2 line-clamp-2 leading-tight">
        {grant.opportunity?.title || 'Untitled Grant'}
      </h3>

      {/* Amount */}
      <div className="mb-2">
        <p className="text-[14px] font-semibold text-slate-100">
          {formatCurrency(grant.amountRequested)}
        </p>
      </div>

      {/* Deadline Badge */}
      {deadlineInfo && (
        <div className="mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${deadlineInfo.color} bg-slate-700/50`}>
            {deadlineInfo.text}
          </span>
        </div>
      )}

      {/* Progress Bar - Only show for Writing stage */}
      {isWritingStage && progress !== undefined && (
        <div className="mb-2">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assignee Avatar - Positioned bottom-right */}
      {grant.assignedTo && (
        <div className="absolute bottom-2 right-2">
          <Avatar className="w-6 h-6 ring-2 ring-slate-800 shadow-sm">
            <AvatarImage src={grant.assignedTo.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
              {getInitials(grant.assignedTo.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

    </div>
  )
}

// Static Grant Card (for drag overlay)
interface GrantCardProps {
  grant: Grant
  color: ColorType
  progress?: number
  isFlagged?: boolean
  logoUrl?: string | null
}

export function GrantCard({ grant, color, progress, isFlagged = false, logoUrl }: GrantCardProps) {
  const classes = colorClasses[color]
  const deadlineInfo = getDeadlineInfo(grant.opportunity?.deadline || grant.deadline)
  const fitScore = (grant.opportunity as any)?.fitScores?.[0]
  const isWritingStage = grant.status === GrantStatus.WRITING

  return (
    <div
      className={cn(
        'relative w-[260px] p-2.5 rounded-md border border-l-[3px] transition-all',
        `bg-slate-800 border-slate-700/50 shadow-lg ${classes.borderLeft}`
      )}
    >
      {/* Priority Flag - Top Left */}
      {isFlagged && (
        <div className="absolute -top-1 -left-1 z-10">
          <Flag className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
        </div>
      )}

      {/* Fit Score Badge - Top Right */}
      {fitScore && (
        <div
          className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded border ${getFitScoreColor(fitScore.overallScore)}`}
        >
          {fitScore.overallScore}
        </div>
      )}

      {/* Funder logo and name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={grant.funder?.name || 'Funder'}
              className="w-8 h-8 rounded flex-shrink-0 object-cover bg-slate-700"
            />
          ) : (
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${classes.dot}`} />
          )}
          <h4 className="text-xs font-semibold text-slate-200 truncate">
            {grant.funder?.name || 'Unknown Funder'}
          </h4>
        </div>
        <button className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0">
          <MoreHorizontal className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Grant Title */}
      <h3 className="text-[13px] text-slate-300 mb-2 line-clamp-2 leading-tight">
        {grant.opportunity?.title || 'Untitled Grant'}
      </h3>

      {/* Amount */}
      <div className="mb-2">
        <p className="text-[14px] font-semibold text-slate-100">
          {formatCurrency(grant.amountRequested)}
        </p>
      </div>

      {/* Deadline Badge */}
      {deadlineInfo && (
        <div className="mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${deadlineInfo.color} bg-slate-700/50`}>
            {deadlineInfo.text}
          </span>
        </div>
      )}

      {/* Progress Bar - Only show for Writing stage */}
      {isWritingStage && progress !== undefined && (
        <div className="mb-2">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assignee Avatar - Positioned bottom-right */}
      {grant.assignedTo && (
        <div className="absolute bottom-2.5 right-2.5">
          <Avatar className="w-6 h-6 ring-2 ring-slate-800 shadow-sm">
            <AvatarImage src={grant.assignedTo.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
              {getInitials(grant.assignedTo.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}

// Enhanced Pipeline Card Component
export interface PipelineCardProps {
  id: string
  funderName: string
  funderLogo?: string
  grantTitle: string
  programArea: string
  amount: number
  deadline?: Date
  daysLeft?: number
  progress?: number // 0-100 completion percentage
  assignee?: {
    name: string
    initials: string
    avatarUrl?: string
    color?: string
  }
  hasFlag?: boolean
  isDragging?: boolean
  onClick?: () => void
}

// Format currency for pipeline card
function formatAmount(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

// Get deadline text and color
function getDeadlineDisplay(deadline?: Date, daysLeft?: number): { text: string; color: string } | null {
  if (!deadline && daysLeft === undefined) return null

  const days = daysLeft ?? Math.ceil((deadline!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  let color = 'text-slate-400'
  if (days < 0) {
    color = 'text-red-400'
  } else if (days < 7) {
    color = 'text-amber-400'
  }

  const text = days < 0 ? 'Overdue' : `${days} Days Left`

  return { text, color }
}

export function PipelineCard({
  id,
  funderName,
  funderLogo,
  grantTitle,
  programArea,
  amount,
  deadline,
  daysLeft,
  progress,
  assignee,
  hasFlag = false,
  isDragging = false,
  onClick,
}: PipelineCardProps) {
  const deadlineDisplay = getDeadlineDisplay(deadline, daysLeft)

  const handleClick = () => {
    // Don't trigger click during drag
    if (isDragging) return
    onClick?.()
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-slate-800 border border-slate-700 rounded-xl p-4 transition-all',
        // Cursor states
        isDragging ? 'cursor-grabbing' : 'cursor-pointer',
        // Hover states - only when not dragging
        !isDragging && 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10',
        // Dragging state
        isDragging && 'shadow-xl shadow-blue-500/20 opacity-90 rotate-2'
      )}
    >
      {/* 1. Funder Row */}
      <div className="flex items-center gap-2 mb-2">
        {funderLogo ? (
          <img
            src={funderLogo}
            alt={funderName}
            className="w-8 h-8 rounded object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-300">
              {funderName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h3 className="text-slate-100 font-medium text-sm truncate flex-1">
          {funderName}
        </h3>
      </div>

      {/* 2. Grant Title */}
      <h4 className="text-slate-300 text-sm mt-2 line-clamp-2 min-h-[2.5rem]">
        {grantTitle}
      </h4>

      {/* 3. Program Area */}
      <p className="text-slate-500 text-xs mt-1">
        {programArea}
      </p>

      {/* 4. Amount Badge */}
      <div className="mt-3">
        <span className="inline-block bg-slate-700 rounded px-2 py-1 text-sm font-medium text-slate-100">
          {formatAmount(amount)}
        </span>
      </div>

      {/* 5. Deadline */}
      {deadlineDisplay && (
        <div className="mt-2">
          <span className="text-xs text-slate-400">Deadline: </span>
          <span className={cn('text-xs font-medium', deadlineDisplay.color)}>
            {deadlineDisplay.text}
          </span>
        </div>
      )}

      {/* 6. Progress Bar */}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="h-1.5 bg-slate-700 rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 ml-2 font-medium">
              {progress}%
            </span>
          </div>
        </div>
      )}

      {/* 7. Bottom Row - Assignee + Flag */}
      <div className="flex items-center justify-between mt-3">
        {assignee ? (
          <div className="flex items-center gap-2">
            {assignee.avatarUrl ? (
              <img
                src={assignee.avatarUrl}
                alt={assignee.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  assignee.color || 'bg-blue-500/20 text-blue-400'
                )}
              >
                {assignee.initials}
              </div>
            )}
            <span className="text-xs text-slate-400">{assignee.name}</span>
          </div>
        ) : (
          <div />
        )}

        {hasFlag && (
          <Flag className="w-4 h-4 text-red-400 fill-red-400" />
        )}
      </div>
    </div>
  )
}
