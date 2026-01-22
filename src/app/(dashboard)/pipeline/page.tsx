'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, MoreHorizontal, Edit3, LayoutGrid, Table2, Filter, X } from 'lucide-react'
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
import { toast } from 'sonner'
import { PipelineTable } from '@/components/pipeline/pipeline-table'
import { DraggableGrantCard as DraggableCard, GrantCard as StaticGrantCard } from '@/components/pipeline/pipeline-card'
import { GrantStatus, FunderType, type Grant } from '@/types/client-types'

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
    <div className="flex-shrink-0 w-64 sm:w-72">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${classes.dot}`} />
          <h3 className="font-medium text-white text-sm sm:text-base truncate">{column.name}</h3>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full flex-shrink-0">
            {isLoading ? '...' : grants.length}
          </span>
        </div>
        <button className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Column Content - Droppable Area */}
      <div
        ref={setNodeRef}
        className={`
          bg-slate-800/50 border rounded-lg p-2 sm:p-3 min-h-[400px] space-y-2 sm:space-y-3 transition-colors
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
            <DraggableCard key={grant.id} grant={grant} color={column.color} />
          ))
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeGrant, setActiveGrant] = useState<Grant | null>(null)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [showFilters, setShowFilters] = useState(false)

  // Filter state from URL
  const [programId, setProgramId] = useState<string | undefined>(searchParams.get('program') || undefined)
  const [selectedStatuses, setSelectedStatuses] = useState<GrantStatus[]>(() => {
    const statusParam = searchParams.get('statuses')
    return statusParam ? (statusParam.split(',') as GrantStatus[]) : []
  })
  const [funderType, setFunderType] = useState<FunderType | undefined>(() => {
    const typeParam = searchParams.get('funderType')
    return typeParam ? (typeParam as FunderType) : undefined
  })
  const [assignedToId, setAssignedToId] = useState<string | undefined>(searchParams.get('assignedTo') || undefined)

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('pipeline-view')
    if (savedView === 'kanban' || savedView === 'table') {
      setView(savedView)
    }
  }, [])

  // Save view preference to localStorage
  const handleViewChange = (newView: 'kanban' | 'table') => {
    setView(newView)
    localStorage.setItem('pipeline-view', newView)
  }

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (programId) params.set('program', programId)
    if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','))
    if (funderType) params.set('funderType', funderType)
    if (assignedToId) params.set('assignedTo', assignedToId)

    const newUrl = params.toString() ? `/pipeline?${params.toString()}` : '/pipeline'
    router.replace(newUrl, { scroll: false })
  }, [programId, selectedStatuses, funderType, assignedToId, router])

  // Fetch grants with filters
  const { data, isLoading, refetch } = api.grants.list.useQuery({
    programId,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    funderType,
    assignedToId,
  })

  // Transform Decimal to number at the boundary
  const grants: Grant[] = (data?.grants ?? []).map(g => ({
    ...g,
    amountRequested: g.amountRequested ? Number(g.amountRequested) : null,
    amountAwarded: g.amountAwarded ? Number(g.amountAwarded) : null,
  }))

  // Fetch programs for filter
  const { data: programsData } = api.programs.list.useQuery()
  const programs = programsData || []

  // Fetch team members for assignee filter
  // TODO: Implement team.listMembers endpoint
  const teamMembers: any[] = []

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
  const grantsByStatus = grants.reduce<Record<string, Grant[]>>((acc, grant) => {
    if (!acc[grant.status]) {
      acc[grant.status] = []
    }
    acc[grant.status].push(grant)
    return acc
  }, {})

  // Calculate stats
  const totalValue = grants.reduce((sum, grant) => {
    return sum + (grant.amountRequested ?? 0)
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

  // Clear all filters
  const handleClearFilters = () => {
    setProgramId(undefined)
    setSelectedStatuses([])
    setFunderType(undefined)
    setAssignedToId(undefined)
  }

  // Check if any filters are active
  const hasActiveFilters = programId || selectedStatuses.length > 0 || funderType || assignedToId

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Pipeline</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Manage your grant applications.</p>
        </div>
        <button
          onClick={() => router.push('/opportunities')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="w-4 h-4" />
          <span className="md:inline">Add Grant</span>
        </button>
      </div>

      {/* Toolbar: View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
          <button
            onClick={() => handleViewChange('kanban')}
            className={`
              flex-1 sm:flex-none px-3 py-1.5 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors
              ${view === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}
            `}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button
            onClick={() => handleViewChange('table')}
            className={`
              flex-1 sm:flex-none px-3 py-1.5 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors
              ${view === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}
            `}
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${showFilters || hasActiveFilters ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700'}
          `}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {[programId, selectedStatuses.length > 0, funderType, assignedToId].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Filter Grants</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Program Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Program</label>
              <select
                value={programId || ''}
                onChange={(e) => setProgramId(e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program._count.grants})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
              <select
                multiple
                value={selectedStatuses}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value as GrantStatus)
                  setSelectedStatuses(options)
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
              >
                {Object.values(GrantStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Funder Type Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Funder Type</label>
              <select
                value={funderType || ''}
                onChange={(e) => setFunderType(e.target.value ? (e.target.value as FunderType) : undefined)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                {Object.values(FunderType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Assigned To</label>
              <select
                value={assignedToId || ''}
                onChange={(e) => setAssignedToId(e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Team Members</option>
                <option value="unassigned">Unassigned</option>
                {teamMembers?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName || member.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm">
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

      {/* Conditional View Rendering */}
      {view === 'table' ? (
        <PipelineTable grants={grants} />
      ) : (
        /* Kanban Board */
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
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
                <StaticGrantCard
                  grant={activeGrant}
                  color={COLUMNS.find(c => c.id === activeGrant.status)?.color || 'slate'}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
