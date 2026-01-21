'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, ArrowUp, ArrowDown, Edit3, Archive, Download, MoreHorizontal } from 'lucide-react'
import { GrantStatus } from '@prisma/client'
import { api } from '@/lib/trpc/client'
import { exportAndDownloadGrants } from '@/lib/export'
import { toast } from 'sonner'

type Grant = NonNullable<ReturnType<typeof api.grants.list.useQuery>['data']>['grants'][number]

type Tab = 'active' | 'awarded' | 'declined' | 'completed'

type SortField = 'funder' | 'program' | 'amount' | 'deadline' | 'status' | 'daysLeft'
type SortDirection = 'asc' | 'desc'

// Tab configurations
const TABS: Array<{ id: Tab; label: string; statuses: GrantStatus[] }> = [
  {
    id: 'active',
    label: 'Active',
    statuses: [
      GrantStatus.PROSPECT,
      GrantStatus.RESEARCHING,
      GrantStatus.WRITING,
      GrantStatus.REVIEW,
      GrantStatus.SUBMITTED,
      GrantStatus.PENDING,
    ],
  },
  { id: 'awarded', label: 'Awarded', statuses: [GrantStatus.AWARDED] },
  { id: 'declined', label: 'Declined', statuses: [GrantStatus.DECLINED] },
  { id: 'completed', label: 'Completed', statuses: [GrantStatus.COMPLETED, GrantStatus.CLOSEOUT, GrantStatus.ACTIVE] },
]

// Status badge colors
const STATUS_COLORS: Record<GrantStatus, string> = {
  PROSPECT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  RESEARCHING: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  WRITING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  SUBMITTED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  PENDING: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  AWARDED: 'bg-green-500/20 text-green-300 border-green-500/30',
  DECLINED: 'bg-red-500/20 text-red-300 border-red-500/30',
  ACTIVE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CLOSEOUT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  COMPLETED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

// Program colors (cycling through a palette)
const PROGRAM_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
]

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

// Calculate days remaining
function getDaysRemaining(deadline: Date | null | undefined): number | null {
  if (!deadline) return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// Get deadline color based on urgency
function getDeadlineColor(days: number | null): string {
  if (days === null) return 'text-slate-400'
  if (days < 0) return 'text-red-400'
  if (days < 7) return 'text-red-400'
  if (days <= 14) return 'text-amber-400'
  return 'text-green-400'
}

// Get program color (deterministic based on program ID)
function getProgramColor(programId: string | null): string {
  if (!programId) return 'bg-slate-500'
  const hash = programId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return PROGRAM_COLORS[hash % PROGRAM_COLORS.length]
}

interface PipelineTableProps {
  grants: Grant[]
}

export function PipelineTable({ grants }: PipelineTableProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('active')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('deadline')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const updateStatusMutation = api.grants.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message)
    },
  })

  // Filter grants by active tab
  const filteredGrants = useMemo(() => {
    const tabConfig = TABS.find((t) => t.id === activeTab)
    if (!tabConfig) return []
    return grants.filter((grant) => tabConfig.statuses.includes(grant.status))
  }, [grants, activeTab])

  // Sort grants
  const sortedGrants = useMemo(() => {
    const sorted = [...filteredGrants]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'funder':
          aValue = a.funder?.name || ''
          bValue = b.funder?.name || ''
          break
        case 'program':
          aValue = a.program?.name || ''
          bValue = b.program?.name || ''
          break
        case 'amount':
          aValue = a.amountRequested || 0
          bValue = b.amountRequested || 0
          break
        case 'deadline':
          aValue = a.opportunity?.deadline || a.deadline || new Date('2099-12-31')
          bValue = b.opportunity?.deadline || b.deadline || new Date('2099-12-31')
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'daysLeft':
          aValue = getDaysRemaining(a.opportunity?.deadline || a.deadline) ?? 999999
          bValue = getDaysRemaining(b.opportunity?.deadline || b.deadline) ?? 999999
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredGrants, sortField, sortDirection])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-slate-500" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    )
  }

  // Handle row selection
  const toggleSelection = (grantId: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(grantId)) {
      newSelection.delete(grantId)
    } else {
      newSelection.add(grantId)
    }
    setSelectedIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedGrants.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedGrants.map((g) => g.id)))
    }
  }

  // Handle bulk export
  const handleExport = () => {
    const selectedGrants = sortedGrants.filter((g) => selectedIds.has(g.id))
    if (selectedGrants.length === 0) {
      toast.error('No grants selected')
      return
    }
    exportAndDownloadGrants(selectedGrants)
    toast.success(`Exported ${selectedGrants.length} grant(s)`)
  }

  // Handle status change
  const handleStatusChange = async (grantId: string, newStatus: GrantStatus) => {
    await updateStatusMutation.mutateAsync({ id: grantId, status: newStatus })
  }

  // Empty state messages
  const emptyStateMessages: Record<Tab, string> = {
    active: 'No active grants. Start by adding opportunities from Smart Discovery.',
    awarded: 'No awarded grants yet. Keep applying!',
    declined: 'No declined grants. (That\'s good!)',
    completed: 'No completed grants yet.',
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        {TABS.map((tab) => {
          const count = grants.filter((g) => tab.statuses.includes(g.status)).length
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSelectedIds(new Set()) // Clear selection when switching tabs
              }}
              className={`
                px-4 py-2 font-medium text-sm transition-colors relative
                ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`
                    ml-2 px-2 py-0.5 text-xs rounded-full
                    ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <span className="text-sm text-slate-300">
            {selectedIds.size} grant{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {sortedGrants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <p className="text-slate-400 text-center">{emptyStateMessages[activeTab]}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-700 rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === sortedGrants.length && sortedGrants.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('funder')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Grant/Funder {getSortIcon('funder')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('program')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Program {getSortIcon('program')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Amount {getSortIcon('amount')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('deadline')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Deadline {getSortIcon('deadline')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Status {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('daysLeft')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Days Left {getSortIcon('daysLeft')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-slate-300">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/50 divide-y divide-slate-700">
              {sortedGrants.map((grant) => {
                const deadline = grant.opportunity?.deadline || grant.deadline
                const daysRemaining = getDaysRemaining(deadline)
                const deadlineColor = getDeadlineColor(daysRemaining)
                const programColor = getProgramColor(grant.programId)

                return (
                  <tr
                    key={grant.id}
                    onClick={() => router.push(`/write/${grant.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(grant.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelection(grant.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {grant.funder?.name || 'Unknown Funder'}
                        </span>
                        {grant.opportunity?.title && (
                          <span className="text-xs text-slate-400 truncate max-w-xs">
                            {grant.opportunity.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {grant.program ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${programColor}`} />
                          <span className="text-sm text-slate-300">{grant.program.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(grant.amountRequested)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {deadline ? (
                        <span className="text-sm text-slate-300">
                          {new Date(deadline).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${
                          STATUS_COLORS[grant.status]
                        }`}
                      >
                        {grant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {daysRemaining !== null ? (
                        <span className={`text-sm font-medium ${deadlineColor}`}>
                          {daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : daysRemaining}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/write/${grant.id}`)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          title="Open in Writer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Write
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Implement archive functionality
                            toast.info('Archive functionality coming soon')
                          }}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 text-slate-400 hover:text-amber-400" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
