'use client'

import { useRouter } from 'next/navigation'
import { Edit3, MoreHorizontal, Flag } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/lib/trpc/client'

// Grant Status Enum
enum GrantStatus {
  PROSPECT = 'PROSPECT',
  RESEARCHING = 'RESEARCHING',
  WRITING = 'WRITING',
  REVIEW = 'REVIEW',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  AWARDED = 'AWARDED',
  DECLINED = 'DECLINED',
  ACTIVE = 'ACTIVE',
  CLOSEOUT = 'CLOSEOUT',
  COMPLETED = 'COMPLETED',
}

// Grant type definition (client-safe, no server imports)
interface Grant {
  id: string
  title: string
  status: GrantStatus
  deadline: Date | null
  amountRequested: number | null
  amountAwarded: number | null
  assigneeId: string | null
  funderId: string | null
  opportunityId: string | null
  createdAt: Date
  updatedAt: Date
  funder?: { id: string; name: string } | null
  opportunity?: { id: string; title: string; deadline: Date | null } | null
  assignee?: { id: string; name: string | null; email: string } | null
  assignedTo?: {
    id: string
    name: string | null
    email: string
    displayName: string | null
    avatarUrl: string | null
  } | null
}

type ColorType = 'slate' | 'purple' | 'blue' | 'amber' | 'cyan' | 'orange' | 'green' | 'red'

const colorClasses: Record<ColorType, { dot: string; border: string; bg: string }> = {
  slate: { dot: 'bg-slate-500', border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
  purple: { dot: 'bg-purple-500', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  blue: { dot: 'bg-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  amber: { dot: 'bg-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  cyan: { dot: 'bg-cyan-500', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
  orange: { dot: 'bg-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  green: { dot: 'bg-green-500', border: 'border-green-500/30', bg: 'bg-green-500/10' },
  red: { dot: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10' },
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
}

export function DraggableGrantCard({ grant, color, progress, isFlagged = false }: DraggableGrantCardProps) {
  const router = useRouter()
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        group relative p-4 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing
        bg-slate-800/70 border-slate-700/50
        shadow-sm
        ${isDragging
          ? 'opacity-60 scale-105 shadow-2xl shadow-blue-500/30 border-blue-400/50 bg-slate-800/40'
          : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 hover:border-slate-600'
        }
      `}
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

      {/* Status dot and funder name */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${classes.dot}`} />
          <h4 className="text-sm font-medium text-white truncate">
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

      {/* Amount */}
      <div className="mb-2">
        <span className="text-xs text-slate-400">Amount Requested</span>
        <p className="text-lg font-semibold text-white">
          {formatCurrency(grant.amountRequested ? Number(grant.amountRequested) : null)}
        </p>
      </div>

      {/* Progress Bar - Only show for Writing stage */}
      {isWritingStage && progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs text-slate-300 font-medium">{progress}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assignee Avatar */}
      {grant.assignedTo && (
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6 ring-2 ring-slate-800 shadow-sm">
            <AvatarImage src={grant.assignedTo.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
              {getInitials(grant.assignedTo.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-400">
            {grant.assignedTo.displayName || 'Unknown'}
          </span>
        </div>
      )}

      {/* Deadline */}
      {deadlineInfo && (
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="text-slate-400">Deadline:</span>
          <span className={`font-medium ${deadlineInfo.color}`}>
            {deadlineInfo.text}
          </span>
        </div>
      )}

      {/* Open in Writer Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/write/${grant.id}`)
        }}
        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-medium transition-colors"
      >
        <Edit3 className="w-3 h-3" />
        Open in Writer
      </button>
    </div>
  )
}

// Static Grant Card (for drag overlay)
interface GrantCardProps {
  grant: Grant
  color: ColorType
  progress?: number
  isFlagged?: boolean
}

export function GrantCard({ grant, color, progress, isFlagged = false }: GrantCardProps) {
  const classes = colorClasses[color]
  const deadlineInfo = getDeadlineInfo(grant.opportunity?.deadline || grant.deadline)
  const fitScore = (grant.opportunity as any)?.fitScores?.[0]
  const isWritingStage = grant.status === GrantStatus.WRITING

  return (
    <div
      className={`
        relative p-4 rounded-lg border transition-all
        bg-slate-800/70 border-slate-700/50 shadow-lg
      `}
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

      {/* Status dot and funder name */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${classes.dot}`} />
          <h4 className="text-sm font-medium text-white truncate">
            {grant.funder?.name || 'Unknown Funder'}
          </h4>
        </div>
        <button className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0">
          <MoreHorizontal className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Amount */}
      <div className="mb-2">
        <span className="text-xs text-slate-400">Amount Requested</span>
        <p className="text-lg font-semibold text-white">
          {formatCurrency(grant.amountRequested ? Number(grant.amountRequested) : null)}
        </p>
      </div>

      {/* Progress Bar - Only show for Writing stage */}
      {isWritingStage && progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs text-slate-300 font-medium">{progress}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assignee Avatar */}
      {grant.assignedTo && (
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6 ring-2 ring-slate-800 shadow-sm">
            <AvatarImage src={grant.assignedTo.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
              {getInitials(grant.assignedTo.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-400">
            {grant.assignedTo.displayName || 'Unknown'}
          </span>
        </div>
      )}

      {/* Deadline */}
      {deadlineInfo && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Deadline:</span>
          <span className={`font-medium ${deadlineInfo.color}`}>
            {deadlineInfo.text}
          </span>
        </div>
      )}
    </div>
  )
}
