'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { GrantStatus, type Grant } from '@/types/client-types'
import { DraggableGrantCard, GrantCard } from './pipeline-card'
import { KanbanColumn } from './kanban-column'
import { PipelineHeader } from './pipeline-header'
import { PipelineFilters } from './pipeline-filters'
import { api } from '@/lib/trpc/client'
import { toast } from '@/components/ui/toast'

type ColorType = 'slate' | 'purple' | 'blue' | 'amber' | 'cyan' | 'orange' | 'green' | 'red'

// Kanban column configuration
const KANBAN_COLUMNS: Array<{
  id: GrantStatus
  label: string
  color: ColorType
  description: string
}> = [
  {
    id: GrantStatus.PROSPECT,
    label: 'Prospect',
    color: 'slate',
    description: 'Potential opportunities',
  },
  {
    id: GrantStatus.RESEARCHING,
    label: 'Researching',
    color: 'purple',
    description: 'Gathering information',
  },
  {
    id: GrantStatus.WRITING,
    label: 'Writing',
    color: 'blue',
    description: 'Drafting proposal',
  },
  {
    id: GrantStatus.REVIEW,
    label: 'Review',
    color: 'amber',
    description: 'Internal review',
  },
  {
    id: GrantStatus.SUBMITTED,
    label: 'Submitted',
    color: 'cyan',
    description: 'Awaiting decision',
  },
  {
    id: GrantStatus.PENDING,
    label: 'Pending',
    color: 'orange',
    description: 'Under consideration',
  },
]

export type ViewMode = 'kanban' | 'list' | 'calendar'

export interface FilterState {
  funder: string
  programArea: string
  assignee: string
  deadline: string
  sortBy: string
}

interface PipelineKanbanProps {
  grants: Grant[]
  defaultView?: ViewMode
}

export function PipelineKanban({ grants, defaultView = 'kanban' }: PipelineKanbanProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<GrantStatus>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [filters, setFilters] = useState<FilterState>({
    funder: 'all',
    programArea: 'all',
    assignee: 'all',
    deadline: 'all',
    sortBy: 'deadline',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const updateStatusMutation = api.grants.updateStatus.useMutation({
    onError: (error) => {
      toast.error('Failed to move grant: ' + error.message)
    },
  })

  // Calculate total pipeline value
  const totalValue = useMemo(() => {
    return grants.reduce((sum, grant) => sum + (grant.amountRequested || 0), 0)
  }, [grants])

  // Apply filters
  const filteredGrants = useMemo(() => {
    return grants.filter((grant) => {
      if (filters.funder !== 'all' && grant.funderId !== filters.funder) return false
      if (filters.programArea !== 'all' && grant.programId !== filters.programArea) return false
      if (filters.assignee !== 'all' && grant.assignedToId !== filters.assignee) return false

      if (filters.deadline !== 'all') {
        const deadline = grant.opportunity?.deadline || grant.deadline
        if (!deadline) return false

        const now = new Date()
        const daysRemaining = Math.ceil(
          (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (filters.deadline === 'week' && daysRemaining > 7) return false
        if (filters.deadline === 'month' && daysRemaining > 30) return false
        if (filters.deadline === 'overdue' && daysRemaining >= 0) return false
      }

      return true
    })
  }, [grants, filters])

  // Group grants by status
  const grantsByStatus = useMemo(() => {
    const grouped = new Map<GrantStatus, Grant[]>()

    KANBAN_COLUMNS.forEach((col) => {
      grouped.set(col.id, [])
    })

    filteredGrants.forEach((grant) => {
      const statusGrants = grouped.get(grant.status) || []
      statusGrants.push(grant)
      grouped.set(grant.status, statusGrants)
    })

    return grouped
  }, [filteredGrants])

  // Calculate mock progress for Writing stage (would come from backend in real app)
  const getGrantProgress = (grant: Grant): number => {
    if (grant.status !== GrantStatus.WRITING) return 0
    // Mock progress - in reality, this would be calculated from document completion
    return Math.floor(Math.random() * 100)
  }

  // Get funder logo URL (mock - would come from backend)
  const getFunderLogoUrl = (grant: Grant): string | null => {
    // In a real app, this would come from the funder data
    return grant.funder?.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(grant.funder.name)}&background=1e293b&color=94a3b8` : null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const grantId = active.id as string
    const newStatus = over.id as GrantStatus

    const grant = grants.find((g) => g.id === grantId)
    if (!grant || grant.status === newStatus) return

    const previousStatus = grant.status
    const grantTitle = grant.opportunity?.title || 'Grant'
    const newStatusLabel = KANBAN_COLUMNS.find((col) => col.id === newStatus)?.label || newStatus

    try {
      await updateStatusMutation.mutateAsync({ id: grantId, status: newStatus })

      // Show success toast with undo action
      toast.success(`Moved "${grantTitle}" to ${newStatusLabel}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await updateStatusMutation.mutateAsync({ id: grantId, status: previousStatus })
              const previousStatusLabel = KANBAN_COLUMNS.find((col) => col.id === previousStatus)?.label || previousStatus
              toast.info(`Restored "${grantTitle}" to ${previousStatusLabel}`)
            } catch (error) {
              toast.error('Failed to undo move')
            }
          },
        },
        duration: 5000,
      })
    } catch (error) {
      // Error already handled by mutation
    }
  }

  const toggleColumnCollapse = (status: GrantStatus) => {
    const newCollapsed = new Set(collapsedColumns)
    if (newCollapsed.has(status)) {
      newCollapsed.delete(status)
    } else {
      newCollapsed.add(status)
    }
    setCollapsedColumns(newCollapsed)
  }

  const activeGrant = activeId ? grants.find((g) => g.id === activeId) : null
  const activeColumn = activeGrant
    ? KANBAN_COLUMNS.find((col) => col.id === activeGrant.status)
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Header with total value and view toggle */}
      <PipelineHeader
        totalValue={totalValue}
        grantCount={filteredGrants.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Filters */}
      <PipelineFilters
        filters={filters}
        onFiltersChange={setFilters}
        grants={grants}
      />

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-3 p-4 h-full min-w-max">
              {KANBAN_COLUMNS.map((column) => {
                const columnGrants = grantsByStatus.get(column.id) || []
                const isCollapsed = collapsedColumns.has(column.id)

                return (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    label={column.label}
                    color={column.color}
                    description={column.description}
                    count={columnGrants.length}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => toggleColumnCollapse(column.id)}
                  >
                    <div className="space-y-3">
                      {columnGrants.map((grant) => (
                        <DraggableGrantCard
                          key={grant.id}
                          grant={grant}
                          color={column.color}
                          progress={getGrantProgress(grant)}
                          logoUrl={getFunderLogoUrl(grant)}
                          isFlagged={false} // Would come from grant data
                        />
                      ))}
                      {columnGrants.length === 0 && (
                        <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                          Drop grants here
                        </div>
                      )}
                    </div>
                  </KanbanColumn>
                )
              })}
            </div>
          </div>

          <DragOverlay>
            {activeGrant && activeColumn ? (
              <div style={{ transform: 'scale(1.02) rotate(2deg)' }} className="shadow-xl">
                <GrantCard
                  grant={activeGrant}
                  color={activeColumn.color}
                  progress={getGrantProgress(activeGrant)}
                  logoUrl={getFunderLogoUrl(activeGrant)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List view placeholder */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-center flex-1 text-slate-400">
          List view coming soon
        </div>
      )}

      {/* Calendar view placeholder */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-center flex-1 text-slate-400">
          Calendar view coming soon
        </div>
      )}
    </div>
  )
}
