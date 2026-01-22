'use client'

import { useState, FormEvent } from 'react'
import { X, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/trpc/client'
import { CommitmentType } from '@prisma/client'

export interface AddCommitmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const TYPE_LABELS: Record<CommitmentType, string> = {
  DELIVERABLE: 'Deliverable',
  OUTCOME_METRIC: 'Outcome Metric',
  REPORT_DUE: 'Report Due',
  BUDGET_SPEND: 'Budget',
  STAFFING: 'Staffing',
  TIMELINE: 'Timeline'
}

export function AddCommitmentModal({ isOpen, onClose, onSuccess }: AddCommitmentModalProps) {
  const [formData, setFormData] = useState({
    grantId: '',
    type: 'DELIVERABLE' as CommitmentType,
    description: '',
    metricName: '',
    metricValue: '',
    dueDate: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [grantSearchQuery, setGrantSearchQuery] = useState('')

  // Fetch grants for dropdown
  const { data: grantsData } = api.grants.list.useQuery({
    limit: 100,
    statuses: ['AWARDED', 'SUBMITTED']
  })

  // Create commitment mutation
  const createMutation = api.compliance.createCommitment.useMutation({
    onSuccess: () => {
      handleClose()
      onSuccess()
    },
    onError: (error) => {
      setErrors({ submit: error.message })
    }
  })

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      grantId: '',
      type: 'DELIVERABLE',
      description: '',
      metricName: '',
      metricValue: '',
      dueDate: ''
    })
    setErrors({})
    setGrantSearchQuery('')
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (!formData.grantId) {
      newErrors.grantId = 'Grant selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    createMutation.mutate({
      grantId: formData.grantId,
      type: formData.type,
      description: formData.description.trim(),
      metricName: formData.metricName.trim() || undefined,
      metricValue: formData.metricValue.trim() || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    })
  }

  // Filter grants based on search query
  const filteredGrants = (grantsData?.grants || []).filter((grant: any) => {
    const searchLower = grantSearchQuery.toLowerCase()
    return (
      grant.title?.toLowerCase().includes(searchLower) ||
      grant.funder?.name?.toLowerCase().includes(searchLower)
    )
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Commitment</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grant Selection with Search */}
          <div>
            <label htmlFor="grant" className="block text-slate-400 text-sm mb-1">
              Grant <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              {/* Search Input */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={grantSearchQuery}
                  onChange={(e) => setGrantSearchQuery(e.target.value)}
                  placeholder="Search grants..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Grant Dropdown */}
              <select
                value={formData.grantId}
                onChange={(e) => setFormData({ ...formData, grantId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              >
                <option value="">Select a grant</option>
                {filteredGrants.map((grant: any) => (
                  <option key={grant.id} value={grant.id}>
                    {grant.funder?.name || 'Unknown'} - {grant.title || 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
            {errors.grantId && (
              <p className="mt-1 text-sm text-red-400">{errors.grantId}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-slate-400 text-sm mb-1">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CommitmentType })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Commitment Description */}
          <div>
            <label htmlFor="description" className="block text-slate-400 text-sm mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors min-h-[80px] resize-y"
              placeholder="Submit Quarterly Financial Report"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Metric Name (Optional) */}
          <div>
            <label htmlFor="metricName" className="block text-slate-400 text-sm mb-1">
              Metric Name (Optional)
            </label>
            <input
              id="metricName"
              type="text"
              value={formData.metricName}
              onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              placeholder="e.g., Students served"
            />
          </div>

          {/* Metric Value (Optional) */}
          <div>
            <label htmlFor="metricValue" className="block text-slate-400 text-sm mb-1">
              Metric Value (Optional)
            </label>
            <input
              id="metricValue"
              type="text"
              value={formData.metricValue}
              onChange={(e) => setFormData({ ...formData, metricValue: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              placeholder="e.g., 500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-slate-400 text-sm mb-1">
              Due Date (Optional)
            </label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors [color-scheme:dark]"
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-400">{errors.dueDate}</p>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Commitment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
