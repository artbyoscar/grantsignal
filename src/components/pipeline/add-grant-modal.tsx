'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X } from 'lucide-react'
import { GrantStatus } from '@/types/client-types'

export interface AddGrantModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NewGrantData) => void
  defaultStatus?: string
}

export interface NewGrantData {
  title: string
  funderName: string
  amount?: number
  deadline?: Date
  status: string
  programArea?: string
}

const statusOptions = [
  { value: GrantStatus.PROSPECT, label: 'Prospect' },
  { value: GrantStatus.RESEARCHING, label: 'Researching' },
  { value: GrantStatus.WRITING, label: 'Writing' },
  { value: GrantStatus.REVIEW, label: 'Review' },
  { value: GrantStatus.SUBMITTED, label: 'Submitted' },
  { value: GrantStatus.PENDING, label: 'Pending' },
  { value: GrantStatus.AWARDED, label: 'Awarded' },
  { value: GrantStatus.DECLINED, label: 'Declined' },
]

export function AddGrantModal({ isOpen, onClose, onSubmit, defaultStatus }: AddGrantModalProps) {
  const [formData, setFormData] = useState<NewGrantData>({
    title: '',
    funderName: '',
    status: defaultStatus || GrantStatus.PROSPECT,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update status when defaultStatus changes and modal opens
  useEffect(() => {
    if (isOpen && defaultStatus) {
      setFormData((prev) => ({
        ...prev,
        status: defaultStatus,
      }))
    }
  }, [isOpen, defaultStatus])

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      title: '',
      funderName: '',
      status: defaultStatus || GrantStatus.PROSPECT,
    })
    setErrors({})
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Grant title is required'
    }

    if (!formData.funderName.trim()) {
      newErrors.funderName = 'Funder name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit(formData)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Grant</h2>
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
          {/* Grant Title */}
          <div>
            <label htmlFor="title" className="block text-slate-400 text-sm mb-1">
              Grant Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              placeholder="Enter grant title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Funder Name */}
          <div>
            <label htmlFor="funderName" className="block text-slate-400 text-sm mb-1">
              Funder Name <span className="text-red-400">*</span>
            </label>
            <input
              id="funderName"
              type="text"
              value={formData.funderName}
              onChange={(e) => setFormData({ ...formData, funderName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              placeholder="Enter funder name"
            />
            {errors.funderName && (
              <p className="mt-1 text-sm text-red-400">{errors.funderName}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-slate-400 text-sm mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={formData.amount || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  amount: e.target.value ? parseInt(e.target.value, 10) : undefined
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-slate-400 text-sm mb-1">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={formData.deadline ? formData.deadline.toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({
                ...formData,
                deadline: e.target.value ? new Date(e.target.value) : undefined
              })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-slate-400 text-sm mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Program Area */}
          <div>
            <label htmlFor="programArea" className="block text-slate-400 text-sm mb-1">
              Program Area
            </label>
            <input
              id="programArea"
              type="text"
              value={formData.programArea || ''}
              onChange={(e) => setFormData({
                ...formData,
                programArea: e.target.value || undefined
              })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              placeholder="e.g., Education, Health, Arts"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Add Grant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
