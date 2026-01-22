'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { PipelineTable } from '@/components/pipeline/pipeline-table'
import { PipelineHeader } from '@/components/pipeline/pipeline-header'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { AddGrantModal, type NewGrantData } from '@/components/pipeline/add-grant-modal'
import { GrantStatus, FunderType, type Grant } from '@/types/client-types'
import type { PipelineCardProps } from '@/components/pipeline/pipeline-card'

// Column configuration with colors
const COLUMNS = [
  { id: GrantStatus.PROSPECT, title: 'Prospect', color: '#64748b' },
  { id: GrantStatus.RESEARCHING, title: 'Researching', color: '#a855f7' },
  { id: GrantStatus.WRITING, title: 'Writing', color: '#3b82f6' },
  { id: GrantStatus.REVIEW, title: 'Review', color: '#f59e0b' },
  { id: GrantStatus.SUBMITTED, title: 'Submitted', color: '#06b6d4' },
  { id: GrantStatus.PENDING, title: 'Pending', color: '#f97316' },
  { id: GrantStatus.AWARDED, title: 'Awarded', color: '#10b981' },
  { id: GrantStatus.DECLINED, title: 'Declined', color: '#ef4444' },
] as const

export default function PipelinePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State management
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'calendar'>('kanban')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedColumnForAdd, setSelectedColumnForAdd] = useState<string | null>(null)
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
    if (savedView === 'kanban' || savedView === 'list' || savedView === 'calendar') {
      setActiveView(savedView)
    }
  }, [])

  // Save view preference to localStorage
  const handleViewChange = (newView: 'kanban' | 'list' | 'calendar') => {
    setActiveView(newView)
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

  // Calculate stats
  const totalValue = grants.reduce((sum, grant) => {
    return sum + (grant.amountRequested ?? 0)
  }, 0)

  // Transform grants to PipelineCardProps
  const transformGrantToCard = (grant: Grant): PipelineCardProps => {
    const deadline = grant.opportunity?.deadline || grant.deadline
    const daysLeft = deadline
      ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined

    return {
      id: grant.id,
      funderName: grant.funder?.name || 'Unknown Funder',
      funderLogo: grant.funder?.name
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(grant.funder.name)}&background=1e293b&color=94a3b8`
        : undefined,
      grantTitle: grant.opportunity?.title || 'Untitled Grant',
      programArea: grant.program?.name || 'General',
      amount: grant.amountRequested || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      daysLeft,
      progress: grant.status === GrantStatus.WRITING ? Math.floor(Math.random() * 100) : undefined,
      assignee: grant.assignedTo
        ? {
            name: grant.assignedTo.displayName || 'Unknown',
            initials: grant.assignedTo.displayName
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '?',
            avatarUrl: grant.assignedTo.avatarUrl || undefined,
          }
        : undefined,
      hasFlag: false, // Could be determined by deadline urgency or other criteria
    }
  }

  // Transform grants to column format for KanbanBoard
  const columns = COLUMNS.map((column) => ({
    id: column.id,
    title: column.title,
    color: column.color,
    cards: grants
      .filter((grant) => grant.status === column.id)
      .map(transformGrantToCard),
  }))

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

  // Handle card move with optimistic updates
  const handleCardMove = async (
    cardId: string,
    fromColumn: string,
    toColumn: string,
    newIndex: number
  ) => {
    if (fromColumn === toColumn) return

    const newStatus = toColumn as GrantStatus

    // Optimistic update: this will be reflected immediately in the UI
    // because the mutation will trigger a refetch
    try {
      await updateStatusMutation.mutateAsync({
        id: cardId,
        status: newStatus,
      })
    } catch (error) {
      // Error already handled by mutation
    }
  }

  // Handle card click - navigate to writer
  const handleCardClick = (cardId: string) => {
    router.push(`/write/${cardId}`)
  }

  // Handle add card button
  const handleAddCard = (columnId: string) => {
    setSelectedColumnForAdd(columnId)
    setIsAddModalOpen(true)
  }

  // Create grant mutation
  const createGrantMutation = api.grants.create.useMutation({
    onSuccess: () => {
      toast.success('Grant added successfully')
      refetch()
      setIsAddModalOpen(false)
    },
    onError: (error) => {
      toast.error(`Failed to create grant: ${error.message}`)
    },
  })

  // Handle add grant submission
  const handleAddGrant = async (data: NewGrantData) => {
    try {
      // Note: This is a simplified implementation
      // In a real app, you'd need to either:
      // 1. Create/lookup the funder first
      // 2. Or extend the grants.create mutation to accept funderName
      await createGrantMutation.mutateAsync({
        status: data.status as GrantStatus,
        amountRequested: data.amount,
        deadline: data.deadline,
        notes: `Grant for: ${data.title}\nFunder: ${data.funderName}${data.programArea ? `\nProgram: ${data.programArea}` : ''}`,
      })
    } catch (error) {
      // Error already handled by mutation
    }
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
    <div className="flex flex-col h-full">
      {/* Pipeline Header with view toggles */}
      <PipelineHeader
        totalValue={totalValue}
        grantCount={grants.length}
        viewMode={activeView}
        onViewModeChange={handleViewChange}
      />

      {/* Filter Toggle Bar */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
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
        <div className="p-4 bg-slate-800 border-b border-slate-700 space-y-4">
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'kanban' ? (
          <KanbanBoard
            columns={columns}
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
            onAddCard={handleAddCard}
          />
        ) : activeView === 'list' ? (
          <PipelineTable grants={grants} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Calendar view coming soon
          </div>
        )}
      </div>

      {/* Add Grant Modal */}
      <AddGrantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddGrant}
        defaultStatus={selectedColumnForAdd || undefined}
      />
    </div>
  )
}
