'use client'

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { api } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { UserRole } from '@/types/client-types'

interface EditRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    id: string
    displayName: string
    email: string
    role: UserRole
  }
}

export function EditRoleModal({ open, onOpenChange, member }: EditRoleModalProps) {
  const [newRole, setNewRole] = useState<UserRole>(member.role)
  const utils = api.useUtils()

  useEffect(() => {
    if (open) {
      setNewRole(member.role)
    }
  }, [open, member.role])

  const updateRoleMutation = api.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully')
      utils.team.listMembers.invalidate()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (newRole === member.role) {
      toast.info('Role has not changed')
      onOpenChange(false)
      return
    }

    updateRoleMutation.mutate({
      memberId: member.id,
      role: newRole,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Edit Member Role
          </DialogTitle>
          <DialogDescription>
            Change the role for {member.displayName} ({member.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md">
              <span className="text-slate-300">{member.role}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newRole">New Role</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
              <SelectTrigger id="newRole" disabled={updateRoleMutation.isPending}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Viewer</span>
                    <span className="text-xs text-slate-500">Read-only access to grants and reports</span>
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Member</span>
                    <span className="text-xs text-slate-500">Can create and edit assigned grants</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-slate-500">
                      Can manage team members and all grants
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="OWNER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Owner</span>
                    <span className="text-xs text-slate-500">Full access including billing</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Role Permissions:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              {newRole === 'VIEWER' && (
                <>
                  <li>View grants and documents</li>
                  <li>View reports and analytics</li>
                  <li>Cannot create or edit</li>
                </>
              )}
              {newRole === 'MEMBER' && (
                <>
                  <li>Create and edit own grants</li>
                  <li>Upload and manage documents</li>
                  <li>Limited settings access</li>
                </>
              )}
              {newRole === 'ADMIN' && (
                <>
                  <li>Manage all grants and team members</li>
                  <li>Access all settings</li>
                  <li>Cannot manage billing</li>
                </>
              )}
              {newRole === 'OWNER' && (
                <>
                  <li>Full access to everything</li>
                  <li>Manage billing and organization</li>
                  <li>Delete organization</li>
                </>
              )}
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateRoleMutation.isPending || newRole === member.role}>
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
