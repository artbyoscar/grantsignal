'use client'

import { UserX, AlertTriangle } from 'lucide-react'
import { api } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { UserRole } from '@/types/client-types'

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    id: string
    displayName: string
    email: string
    role: UserRole
  }
}

export function RemoveMemberDialog({ open, onOpenChange, member }: RemoveMemberDialogProps) {
  const utils = api.useUtils()
  const { data: grantCounts } = api.team.getMemberGrantCounts.useQuery()

  const removeMemberMutation = api.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success('Member removed successfully')
      utils.team.listMembers.invalidate()
      utils.team.getMemberGrantCounts.invalidate()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleRemove = () => {
    removeMemberMutation.mutate({ memberId: member.id })
  }

  const assignedGrantsCount = grantCounts?.[member.id] || 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-slate-100">
            <UserX className="w-5 h-5 text-red-400" />
            Remove Team Member
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-slate-400">
            <p>
              Are you sure you want to remove <strong className="text-slate-300">{member.displayName}</strong>{' '}
              ({member.email}) from your organization?
            </p>

            {assignedGrantsCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-amber-200 font-medium">
                      This member has {assignedGrantsCount}{' '}
                      {assignedGrantsCount === 1 ? 'grant' : 'grants'} assigned.
                    </p>
                    <p className="text-sm text-amber-300/80">
                      When removed, their assigned grants will become unassigned. You can reassign them
                      to other team members from the grants page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-200 font-medium">This action cannot be undone.</p>
                  <p className="text-sm text-red-300/80 mt-1">
                    {member.displayName} will lose access to all organization data and will need to be
                    re-invited to rejoin.
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeMemberMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={removeMemberMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {removeMemberMutation.isPending ? 'Removing...' : 'Remove Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
