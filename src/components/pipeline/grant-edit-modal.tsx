'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/trpc/client'
import { type Grant, GrantStatus } from '@/types/client-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

interface GrantEditModalProps {
  grant: Grant
  isOpen: boolean
  onClose: () => void
}

// Status display names
const statusDisplayNames: Record<GrantStatus, string> = {
  PROSPECT: 'Prospect',
  RESEARCHING: 'Researching',
  WRITING: 'Writing',
  REVIEW: 'Review',
  SUBMITTED: 'Submitted',
  PENDING: 'Pending',
  AWARDED: 'Awarded',
  DECLINED: 'Declined',
  ACTIVE: 'Active',
  CLOSEOUT: 'Closeout',
  COMPLETED: 'Completed',
}

export function GrantEditModal({ grant, isOpen, onClose }: GrantEditModalProps) {
  const utils = api.useUtils()

  // Form state - only editable fields
  const [amount, setAmount] = useState(grant.amountRequested?.toString() || '')
  const [deadline, setDeadline] = useState<Date | undefined>(
    grant.deadline ? new Date(grant.deadline) : undefined
  )
  const [status, setStatus] = useState<GrantStatus>(grant.status)

  // Update form when grant changes
  useEffect(() => {
    setAmount(grant.amountRequested?.toString() || '')
    setDeadline(grant.deadline ? new Date(grant.deadline) : undefined)
    setStatus(grant.status)
  }, [grant])

  // Update grant mutation
  const updateMutation = api.grants.update.useMutation({
    onSuccess: () => {
      toast.success('Grant updated successfully')
      utils.grants.list.invalidate()
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to update grant: ' + error.message)
    },
  })

  // Update status mutation
  const updateStatusMutation = api.grants.updateStatus.useMutation({
    onSuccess: () => {
      utils.grants.list.invalidate()
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (amount && isNaN(parseFloat(amount))) {
      toast.error('Amount must be a valid number')
      return
    }

    const parsedAmount = amount ? parseFloat(amount) : null

    try {
      // Update grant details and status in parallel
      const promises = []

      // Only update amount/deadline if they changed
      if (
        parsedAmount !== grant.amountRequested ||
        deadline?.getTime() !== grant.deadline?.getTime()
      ) {
        promises.push(
          updateMutation.mutateAsync({
            id: grant.id,
            amountRequested: parsedAmount ?? undefined,
            deadline: deadline,
          })
        )
      }

      // If status changed, update it separately
      if (status !== grant.status) {
        promises.push(
          updateStatusMutation.mutateAsync({
            id: grant.id,
            status,
          })
        )
      }

      if (promises.length > 0) {
        await Promise.all(promises)
      } else {
        onClose()
      }
    } catch (error) {
      // Error already handled in mutation callbacks
    }
  }

  const isLoading = updateMutation.isPending || updateStatusMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-100">
            Edit Grant Details
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {grant.opportunity?.title || 'Untitled Grant'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info: Funder and Program (read-only display) */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Funder</span>
              <span className="text-sm text-slate-300 font-medium">
                {grant.funder?.name || 'Not specified'}
              </span>
            </div>
            {grant.program && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Program Area</span>
                <span className="text-sm text-slate-300 font-medium">
                  {grant.program.name}
                </span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-slate-300 text-sm font-medium mb-1.5 block">
              Amount Requested
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline" className="text-slate-300 text-sm font-medium mb-1.5 block">
              Deadline
            </Label>
            <DatePicker
              date={deadline}
              onDateChange={setDeadline}
              placeholder="Select deadline"
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-slate-300 text-sm font-medium mb-1.5 block">
              Stage
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as GrantStatus)} disabled={isLoading}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {Object.entries(statusDisplayNames).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="focus:bg-slate-700 focus:text-slate-100">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
