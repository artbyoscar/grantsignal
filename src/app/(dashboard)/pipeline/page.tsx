'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Edit3 } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { api } from '@/lib/trpc/client'
import { GrantStatus } from '@prisma/client'
import { toast } from 'sonner'

// Column configuration with colors
const COLUMNS = [
  { id: GrantStatus.PROSPECT, name: 'Prospect', color: 'slate' },
  { id: GrantStatus.RESEARCHING, name: 'Researching', color: 'purple' },
  { id: GrantStatus.WRITING, name: 'Writing', color: 'blue' },
  { id: GrantStatus.REVIEW, name: 'Review', color: 'amber' },
  { id: GrantStatus.SUBMITTED, name: 'Submitted', color: 'cyan' },
  { id: GrantStatus.PENDING, name: 'Pending', color: 'orange' },
  { id: GrantStatus.AWARDED, name: 'Awarded', color: 'green' },
  { id: GrantStatus.DECLINED, name: 'Declined', color: 'red' },
] as const

type ColorType = typeof COLUMNS[number]['color']

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

type Grant = NonNullable<ReturnType<typeof api.grants.list.useQuery>['data']>['grants'][number]

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

// Draggable Grant Card Component
function DraggableGrantCard({ grant, color }: { grant: Grant; color: ColorType }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: grant.id,
  })

  const classes = colorClasses[color]
  const deadlineInfo = getDeadlineInfo(grant.opportunity?.deadline || grant.deadline)

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
        p-4 rounded-lg border transition-all cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${classes.border} ${classes.bg}
        bg-slate-800/90 hover:bg-slate-800
      `}
    >
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
          {formatCurrency(grant.amountRequested)}
        </p>
      </div>

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
function GrantCard({ grant, color }: { grant: Grant; color: ColorType }) {
  const classes = colorClasses[color]
  const deadlineInfo = getDeadlineInfo(grant.opportunity?.deadline || grant.deadline)

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all
        ${classes.border} ${classes.bg}
        bg-slate-800/90
      `}
    >
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
          {formatCurrency(grant.amountRequested)}
        </p>
      </div>

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

// Loading Skeleton Component
function GrantCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-slate-600" />
          <div className="h-4 bg-slate-600 rounded w-32" />
        </div>
      </div>
      <div className="mb-2">
        <div className="h-3 bg-slate-600 rounded w-24 mb-1" />
        <div className="h-5 bg-slate-600 rounded w-20" />
      </div>
      <div className="h-3 bg-slate-600 rounded w-28" />
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({
  column,
  grants,
  isLoading
}: {
  column: typeof COLUMNS[number]
  grants: Grant[]
  isLoading: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const classes = colorClasses[column.color]

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${classes.dot}`} />
          <h3 className="font-medium text-white">{column.name}</h3>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
            {isLoading ? '...' : grants.length}
          </span>
        </div>
        <button className="p-1 hover:bg-slate-700 rounded transition-colors">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Column Content - Droppable Area */}
      <div
        ref={setNodeRef}
        className={`
          bg-slate-800/50 border rounded-lg p-3 min-h-[400px] space-y-3 transition-colors
          ${isOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'}
        `}
      >
        {isLoading ? (
          // Loading state
          <>
            <GrantCardSkeleton />
            <GrantCardSkeleton />
          </>
        ) : grants.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-slate-500">No grants</p>
            <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              + Add grant
            </button>
          </div>
        ) : (
          // Grant cards
          grants.map((grant) => (
            <DraggableGrantCard key={grant.id} grant={grant} color={column.color} />
          ))
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [activeGrant, setActiveGrant] = useState<Grant | null>(null)

  // Fetch grants
  const { data, isLoading, refetch } = api.grants.list.useQuery({})
  const grants = data?.grants || []

  // Update status mutation
  const updateStatusMutation = api.grants.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Grant status updated')
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to update grant: ${error.message}`)
      refetch()
    },
  })

  // Group grants by status
  const grantsByStatus = grants.reduce((acc, grant) => {
    if (!acc[grant.status]) {
      acc[grant.status] = []
    }
    acc[grant.status].push(grant)
    return acc
  }, {} as Record<GrantStatus, Grant[]>)

  // Calculate stats
  const totalValue = grants.reduce((sum, grant) => {
    const amount = grant.amountRequested
      ? Number(grant.amountRequested)
      : 0;
    return sum + amount;
  }, 0)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const grantId = event.active.id as string
    const grant = grants.find(g => g.id === grantId)
    if (grant) {
      setActiveGrant(grant)
    }
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    setActiveGrant(null)

    const { active, over } = event

    if (!over) return

    // Get the grant ID and new status
    const grantId = active.id as string
    const newStatus = over.id as GrantStatus

    // Find the grant
    const grant = grants.find(g => g.id === grantId)
    if (!grant || grant.status === newStatus) return

    // Optimistic update: update local state immediately
    const originalStatus = grant.status
    grant.status = newStatus

    // Call mutation
    updateStatusMutation.mutate(
      { id: grantId, status: newStatus },
      {
        onError: () => {
          // Revert on error
          grant.status = originalStatus
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline</h1>
          <p className="text-slate-400 mt-1">Manage your grant applications.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Grant
        </button>
      </div>

      {/* Pipeline Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Total Grants:</span>
          <span className="text-white font-medium">
            {isLoading ? '...' : grants.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Pipeline Value:</span>
          <span className="text-white font-medium">
            {isLoading ? '...' : formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              grants={grantsByStatus[column.id] || []}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeGrant && (
            <div className="w-72">
              <GrantCard
                grant={activeGrant}
                color={COLUMNS.find(c => c.id === activeGrant.status)?.color || 'slate'}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
