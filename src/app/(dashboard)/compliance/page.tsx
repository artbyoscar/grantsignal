'use client'

import { useState } from 'react'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileWarning,
  Search,
  AlertCircle,
  Filter,
  Download,
  Play,
  X,
  ChevronRight,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import {
  CommitmentStatus,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
} from '@prisma/client'

type Commitment = {
  id: string
  description: string
  type: string
  status: CommitmentStatus
  dueDate: Date | null
  metricName: string | null
  metricValue: string | null
  grant: {
    id: string
    status: string
    funder: {
      name: string
    } | null
  }
  sourceDocument: {
    id: string
    name: string
    type: string
  } | null
  conflicts: Array<{
    id: string
    conflictType: ConflictType
    severity: ConflictSeverity
    status: ConflictStatus
  }>
}

type Conflict = {
  id: string
  conflictType: ConflictType
  description: string
  detectedValues: any
  severity: ConflictSeverity
  status: ConflictStatus
  createdAt: Date
  commitment: {
    id: string
    description: string
    metricName: string | null
    metricValue: string | null
    grant: {
      id: string
      funder: {
        name: string
      } | null
    }
  }
}

type AuditLog = {
  id: string
  actionType: string
  description: string
  performedBy: string
  createdAt: Date
  metadata: any
  conflict: {
    commitment: {
      grant: {
        funder: {
          name: string
        } | null
      }
    }
  } | null
}

// Resolution Modal Component
function ResolutionModal({
  conflict,
  onClose,
  onResolve,
}: {
  conflict: Conflict
  onClose: () => void
  onResolve: () => void
}) {
  const [action, setAction] = useState<'UPDATE_DRAFT' | 'FLAG_FOR_REVIEW' | 'IGNORE'>('UPDATE_DRAFT')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolveConflictMutation = trpc.compliance.resolveConflict.useMutation({
    onSuccess: () => {
      onResolve()
      onClose()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setIsSubmitting(true)
    try {
      await resolveConflictMutation.mutateAsync({
        conflictId: conflict.id,
        action,
        reason,
      })
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getConflictTypeColor = (type: ConflictType) => {
    switch (type) {
      case 'METRIC_MISMATCH':
        return 'text-red-400'
      case 'TIMELINE_OVERLAP':
        return 'text-amber-400'
      case 'BUDGET_DISCREPANCY':
        return 'text-orange-400'
      case 'CAPACITY_OVERCOMMIT':
        return 'text-purple-400'
      default:
        return 'text-slate-400'
    }
  }

  const getSeverityBadge = (severity: ConflictSeverity) => {
    const colors = {
      CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
      HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }
    return colors[severity] || colors.LOW
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Resolve Conflict</h2>
              <p className="text-sm text-slate-400">
                {conflict.conflictType.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conflict Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getSeverityBadge(conflict.severity)}`}
              >
                {conflict.severity}
              </span>
              <span className={`text-sm font-medium ${getConflictTypeColor(conflict.conflictType)}`}>
                {conflict.conflictType.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-slate-300">{conflict.description}</p>
          </div>

          {/* Detected Values */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Detected Values</h3>
            <div className="space-y-2">
              {conflict.conflictType === 'METRIC_MISMATCH' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Metric Name:</span>
                    <span className="text-white font-medium">
                      {conflict.detectedValues.metricName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Conflicting Values:</span>
                    <span className="text-red-400 font-medium">
                      {conflict.detectedValues.values?.join(', ') || 'N/A'}
                    </span>
                  </div>
                </>
              )}
              {conflict.conflictType === 'TIMELINE_OVERLAP' && (
                <>
                  <div className="text-sm space-y-1">
                    <span className="text-slate-400">Commitment 1:</span>
                    <p className="text-white">
                      {conflict.detectedValues.commitment1?.description}
                    </p>
                    <span className="text-xs text-slate-500">
                      {conflict.detectedValues.commitment1?.dueDate &&
                        format(
                          new Date(conflict.detectedValues.commitment1.dueDate),
                          'MMM dd, yyyy'
                        )}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <span className="text-slate-400">Commitment 2:</span>
                    <p className="text-white">
                      {conflict.detectedValues.commitment2?.description}
                    </p>
                    <span className="text-xs text-slate-500">
                      {conflict.detectedValues.commitment2?.dueDate &&
                        format(
                          new Date(conflict.detectedValues.commitment2.dueDate),
                          'MMM dd, yyyy'
                        )}
                    </span>
                  </div>
                </>
              )}
              {conflict.conflictType === 'CAPACITY_OVERCOMMIT' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Month:</span>
                    <span className="text-white font-medium">
                      {conflict.detectedValues.month}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Commitments:</span>
                    <span className="text-red-400 font-medium">
                      {conflict.detectedValues.commitmentCount} (threshold:{' '}
                      {conflict.detectedValues.threshold})
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Resolution Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Resolution Action
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="UPDATE_DRAFT"
                    checked={action === 'UPDATE_DRAFT'}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-white font-medium">Update Draft</div>
                    <div className="text-sm text-slate-400">
                      Resolve by updating the grant draft with the correct value
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="FLAG_FOR_REVIEW"
                    checked={action === 'FLAG_FOR_REVIEW'}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-white font-medium">Flag for Review</div>
                    <div className="text-sm text-slate-400">
                      Mark for manual review by team member
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                  <input
                    type="radio"
                    name="action"
                    value="IGNORE"
                    checked={action === 'IGNORE'}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-white font-medium">Ignore</div>
                    <div className="text-sm text-slate-400">
                      This is intentional and not a real conflict
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-white mb-2">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Explain why you're taking this action..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? 'Resolving...' : 'Resolve Conflict'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CompliancePage() {
  const [statusFilter, setStatusFilter] = useState<CommitmentStatus | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'commitments' | 'conflicts' | 'audit'>('commitments')
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Fetch data
  const { data: statistics, refetch: refetchStats } = trpc.compliance.getStatistics.useQuery()
  const { data: commitments, refetch: refetchCommitments } =
    trpc.compliance.listCommitments.useQuery({
      status: statusFilter || undefined,
      includeConflicts: true,
    })
  const { data: conflicts, refetch: refetchConflicts } = trpc.compliance.listCommitments.useQuery({
    includeConflicts: true,
  })
  const { data: auditTrail } = trpc.compliance.getAuditTrail.useQuery({
    limit: 50,
  })
  const { data: exportData } = trpc.compliance.exportAuditTrail.useQuery(
    {},
    { enabled: false }
  )

  const checkConflictsMutation = trpc.compliance.checkConflicts.useMutation({
    onSuccess: () => {
      refetchConflicts()
      refetchStats()
      setIsScanning(false)
    },
  })

  const handleScanConflicts = async () => {
    setIsScanning(true)
    await checkConflictsMutation.mutateAsync({})
  }

  const handleExportAudit = async () => {
    const data = await trpc.compliance.exportAuditTrail.useQuery({}).refetch()
    if (data.data) {
      const blob = new Blob([data.data.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.data.filename
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const getStatusBadge = (status: CommitmentStatus) => {
    const styles = {
      PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return styles[status] || styles.PENDING
  }

  const getSeverityColor = (severity: ConflictSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400'
      case 'HIGH':
        return 'text-orange-400'
      case 'MEDIUM':
        return 'text-amber-400'
      case 'LOW':
        return 'text-blue-400'
      default:
        return 'text-slate-400'
    }
  }

  // Get all conflicts from commitments
  const allConflicts =
    conflicts
      ?.flatMap((c) =>
        c.conflicts.map((conflict) => ({
          ...conflict,
          commitment: c,
        }))
      )
      .filter((c) => c.status === ConflictStatus.UNRESOLVED) || []

  // Filter commitments by search term
  const filteredCommitments =
    commitments?.filter((c) =>
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Compliance Guardian</h1>
        <p className="text-slate-400 mt-1">
          Enterprise-grade commitment tracking and conflict detection across all grants
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Commitments</p>
            <FileWarning className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {statistics?.commitments.total || 0}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Pending</p>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {statistics?.commitments.pending || 0}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Overdue</p>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {statistics?.commitments.overdue || 0}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Unresolved Conflicts</p>
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {statistics?.conflicts.unresolved || 0}
          </p>
        </div>
      </div>

      {/* Conflict Detection */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Conflict Detection</h2>
            <p className="text-sm text-slate-400 mt-1">
              Scan for metric mismatches, timeline overlaps, and budget discrepancies
            </p>
          </div>
          <button
            onClick={handleScanConflicts}
            disabled={isScanning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Scan
              </>
            )}
          </button>
        </div>

        {allConflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No conflicts detected</h3>
            <p className="text-slate-400 text-sm max-w-md">
              All commitments are aligned. Run a scan to check for new conflicts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allConflicts.slice(0, 5).map((conflict) => (
              <div
                key={conflict.id}
                className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium ${getSeverityColor(conflict.severity)}`}
                      >
                        {conflict.severity}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">
                        {conflict.conflictType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{conflict.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedConflict(conflict as any)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                  >
                    Resolve
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {allConflicts.length > 5 && (
              <button
                onClick={() => setActiveTab('conflicts')}
                className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all {allConflicts.length} conflicts →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('commitments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'commitments'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Commitment Registry
        </button>
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'conflicts'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          All Conflicts ({allConflicts.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Audit Trail
        </button>
      </div>

      {/* Commitment Registry */}
      {activeTab === 'commitments' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search commitments..."
                    className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Commitment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Grant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Funder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredCommitments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <FileWarning className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        No commitments found
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {searchTerm || statusFilter
                          ? 'Try adjusting your filters'
                          : 'Commitments will be automatically extracted from grant documents'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCommitments.map((commitment) => (
                    <tr key={commitment.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-white font-medium">
                            {commitment.description}
                          </div>
                          {commitment.metricName && (
                            <div className="text-xs text-slate-400 mt-1">
                              {commitment.metricName}: {commitment.metricValue}
                            </div>
                          )}
                          {commitment.conflicts.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-400">
                                {commitment.conflicts.length} conflict
                                {commitment.conflicts.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300 truncate max-w-xs">
                          {commitment.grant.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">
                          {commitment.grant.funder?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">
                          {commitment.dueDate
                            ? format(new Date(commitment.dueDate), 'MMM dd, yyyy')
                            : 'No date'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusBadge(commitment.status)}`}
                        >
                          {commitment.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-400">
                          {commitment.sourceDocument?.name || 'Manual'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Conflicts */}
      {activeTab === 'conflicts' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">All Detected Conflicts</h2>
          {allConflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="w-16 h-16 text-emerald-500/20 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No conflicts detected</h3>
              <p className="text-slate-400 text-sm max-w-md">
                Run a compliance scan to check for conflicts
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-sm font-medium ${getSeverityColor(conflict.severity)}`}
                        >
                          {conflict.severity}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-sm text-slate-400">
                          {conflict.conflictType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(conflict.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{conflict.description}</p>
                      <p className="text-xs text-slate-500">
                        Grant: {conflict.commitment.grant.id} •{' '}
                        {conflict.commitment.grant.funder?.name || 'No funder'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConflict(conflict as any)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      Resolve
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Audit Trail</h2>
            <button
              onClick={handleExportAudit}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <div className="divide-y divide-slate-700">
            {auditTrail?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileWarning className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No audit logs</h3>
                <p className="text-slate-400 text-sm">
                  Compliance actions will be logged here
                </p>
              </div>
            ) : (
              auditTrail?.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-400">
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{log.description}</p>
                      {log.conflict && (
                        <p className="text-xs text-slate-500 mt-1">
                          Funder: {log.conflict.commitment.grant.funder?.name || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedConflict && (
        <ResolutionModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onResolve={() => {
            refetchConflicts()
            refetchCommitments()
            refetchStats()
          }}
        />
      )}
    </div>
  )
}
