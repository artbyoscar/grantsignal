'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { X, AlertTriangle, Check, Flag, EyeOff, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props {
  conflict: any
  onClose: () => void
  onResolved: () => void
}

export function ResolveConflictModal({ conflict, onClose, onResolved }: Props) {
  const [notes, setNotes] = useState('')

  const resolveMutation = api.compliance.resolveConflict.useMutation({
    onSuccess: () => {
      toast.success('Conflict resolved')
      onResolved()
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to resolve: ${error.message}`)
    }
  })

  const handleUpdateDraft = () => {
    if (!notes.trim()) {
      toast.error('Please provide resolution notes')
      return
    }

    resolveMutation.mutate({
      conflictId: conflict.id,
      resolution: 'RESOLVED',
      notes: notes.trim()
    })
  }

  const handleFlagForReview = () => {
    if (!notes.trim()) {
      toast.error('Please provide notes for review')
      return
    }

    resolveMutation.mutate({
      conflictId: conflict.id,
      resolution: 'FLAGGED',
      notes: notes.trim()
    })
  }

  const handleIgnoreConflict = () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for ignoring')
      return
    }

    resolveMutation.mutate({
      conflictId: conflict.id,
      resolution: 'IGNORE',
      notes: notes.trim()
    })
  }

  // Calculate discrepancy percentage for risk assessment
  const calculateDiscrepancy = () => {
    if (conflict.commitment?.metricValue && conflict.conflictingValue) {
      const original = parseFloat(conflict.commitment.metricValue)
      const conflicting = parseFloat(conflict.conflictingValue)
      if (!isNaN(original) && !isNaN(conflicting)) {
        return Math.abs((conflicting - original) / original * 100)
      }
    }
    return 0
  }

  const discrepancyPercent = calculateDiscrepancy()
  const isHighRisk = discrepancyPercent > 25

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl max-w-[900px] w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-900/20">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Conflict Resolution</h2>
            <p className="text-sm text-slate-400 mt-1">
              {conflict.conflictType?.replace('_', ' ') || 'Data Mismatch'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Three Column Layout */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 mb-6">
            {/* Current Draft Panel */}
            <div className="rounded-lg overflow-hidden border border-blue-600/30">
              <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="font-semibold">Current Draft</span>
              </div>
              <div className="bg-slate-800/80 p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Grant</p>
                  <p className="text-white font-medium">
                    {conflict.commitment?.grant?.funder?.name || 'Unknown Grant'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Commitment</p>
                  <p className="text-white text-sm">
                    {conflict.commitment?.description || 'N/A'}
                  </p>
                </div>
                {conflict.commitment?.metricName && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Metric</p>
                    <p className="text-white text-sm">
                      {conflict.commitment.metricName}: {' '}
                      <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                        {conflict.commitment.metricValue}
                      </span>
                    </p>
                  </div>
                )}
                {conflict.commitment?.dueDate && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Due Date</p>
                    <p className="text-white text-sm">
                      {format(new Date(conflict.commitment.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Center Actions */}
            <div className="flex flex-col items-center justify-center gap-4 min-w-[180px]">
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Diff View
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleUpdateDraft}
                    disabled={resolveMutation.isPending || !notes.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>Update Draft</span>
                  </button>
                  <button
                    onClick={handleFlagForReview}
                    disabled={resolveMutation.isPending || !notes.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Flag for Review</span>
                  </button>
                  <button
                    onClick={handleIgnoreConflict}
                    disabled={resolveMutation.isPending || !notes.trim()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-600 hover:bg-slate-700/50 text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Ignore Conflict</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Conflicting Commitment Panel */}
            <div className="rounded-lg overflow-hidden border border-red-600/30">
              <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">Conflicting Commitment</span>
              </div>
              <div className="bg-slate-800/80 p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Source</p>
                  <p className="text-white font-medium">
                    {conflict.conflictingSource || 'External Report'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Commitment</p>
                  <p className="text-white text-sm">
                    {conflict.conflictingDescription || conflict.description || 'N/A'}
                  </p>
                </div>
                {conflict.conflictingValue && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Conflicting Value</p>
                    <p className="text-white text-sm">
                      {conflict.commitment?.metricName || 'Value'}: {' '}
                      <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                        {conflict.conflictingValue}
                      </span>
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-1">Detected</p>
                  <p className="text-white text-sm">
                    {format(new Date(conflict.detectedAt || conflict.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Notes */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Resolution Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain your resolution decision or provide context..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Risk Assessment Banner */}
          {isHighRisk && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-200 font-semibold text-sm mb-1">
                  High Audit Risk: Discrepancy &gt; 25%
                </p>
                <p className="text-amber-300/80 text-xs mb-2">
                  This conflict shows a significant variance ({discrepancyPercent.toFixed(1)}%)
                  that may trigger audit concerns. Please review carefully and document your decision.
                </p>
                <a
                  href="/compliance/guidelines"
                  className="text-amber-400 hover:text-amber-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  View Compliance Guidelines
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
