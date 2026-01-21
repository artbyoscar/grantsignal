'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { X, AlertTriangle, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props {
  conflict: any
  onClose: () => void
  onResolved: () => void
}

export function ResolveConflictModal({ conflict, onClose, onResolved }: Props) {
  const [resolution, setResolution] = useState<'RESOLVED' | 'IGNORED'>('RESOLVED')
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

  const handleSubmit = () => {
    if (!notes.trim()) {
      toast.error('Please provide resolution notes')
      return
    }

    resolveMutation.mutate({
      conflictId: conflict.id,
      resolution: resolution === 'RESOLVED' ? 'RESOLVED' : 'IGNORE',
      notes: notes.trim()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Resolve Conflict</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conflict Details */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-xs uppercase text-red-400 font-medium">{conflict.conflictType.replace('_', ' ')}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500">Severity: {conflict.severity}</span>
            </div>
            <p className="text-white">{conflict.description}</p>
          </div>

          {/* Suggested Resolution */}
          {conflict.suggestedResolution && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Suggested Resolution</span>
              </div>
              <p className="text-sm text-slate-300">{conflict.suggestedResolution}</p>
            </div>
          )}

          {/* Affected Commitments */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Affected Commitments</h3>
            <div className="space-y-2">
              {[conflict.commitment].map((c: any) => c && (
                <div key={c.id} className="bg-slate-700/50 rounded p-3">
                  <p className="text-white text-sm">{c.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>Grant: {c.grant?.funder?.name || 'Unknown'}</span>
                    {c.metricName && <span>Metric: {c.metricName} = {c.metricValue}</span>}
                    {c.dueDate && <span>Due: {format(new Date(c.dueDate), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Choice */}
          <div>
            <label className="text-sm font-medium text-slate-400 mb-3 block">Resolution Action</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded cursor-pointer hover:bg-slate-700">
                <input
                  type="radio"
                  value="RESOLVED"
                  checked={resolution === 'RESOLVED'}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="text-blue-600"
                />
                <div>
                  <p className="text-white font-medium">Mark as Resolved</p>
                  <p className="text-xs text-slate-400">Issue has been addressed and no longer poses a risk</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded cursor-pointer hover:bg-slate-700">
                <input
                  type="radio"
                  value="IGNORED"
                  checked={resolution === 'IGNORED'}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="text-blue-600"
                />
                <div>
                  <p className="text-white font-medium">Ignore Conflict</p>
                  <p className="text-xs text-slate-400">This is a false positive or acceptable risk</p>
                </div>
              </label>
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="text-sm font-medium text-slate-400 mb-2 block">
              Resolution Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain how this conflict was resolved or why it's being ignored..."
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={resolveMutation.isPending}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={resolveMutation.isPending || !notes.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {resolveMutation.isPending ? 'Resolving...' : 'Resolve Conflict'}
          </button>
        </div>
      </div>
    </div>
  )
}
