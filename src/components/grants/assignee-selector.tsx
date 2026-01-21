'use client'

import { useState } from 'react'
import { User, X } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface AssigneeSelectorProps {
  grantId: string
  currentAssignee?: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  } | null
  variant?: 'full' | 'compact'
  onAssignmentChange?: () => void
}

export function AssigneeSelector({
  grantId,
  currentAssignee,
  variant = 'full',
  onAssignmentChange,
}: AssigneeSelectorProps) {
  const utils = api.useUtils()
  const [isOpen, setIsOpen] = useState(false)

  // Fetch team members
  const { data: members, isLoading: isLoadingMembers } =
    api.team.listMembers.useQuery()

  // Assign mutation
  const assignMutation = api.grants.assignGrant.useMutation({
    onSuccess: () => {
      toast.success('Grant assigned successfully')
      utils.grants.list.invalidate()
      utils.grants.byId.invalidate({ id: grantId })
      onAssignmentChange?.()
    },
    onError: (error) => {
      toast.error('Failed to assign grant: ' + error.message)
    },
  })

  // Unassign mutation
  const unassignMutation = api.grants.unassignGrant.useMutation({
    onSuccess: () => {
      toast.success('Grant unassigned successfully')
      utils.grants.list.invalidate()
      utils.grants.byId.invalidate({ id: grantId })
      onAssignmentChange?.()
    },
    onError: (error) => {
      toast.error('Failed to unassign grant: ' + error.message)
    },
  })

  const handleAssign = async (userId: string) => {
    if (userId === 'unassign') {
      await unassignMutation.mutateAsync({ grantId })
    } else {
      await assignMutation.mutateAsync({ grantId, userId })
    }
    setIsOpen(false)
  }

  const handleUnassign = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await unassignMutation.mutateAsync({ grantId })
  }

  const isLoading =
    assignMutation.isPending || unassignMutation.isPending || isLoadingMembers

  // Get initials from display name
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Compact variant - just shows avatar/icon
  if (variant === 'compact') {
    if (currentAssignee) {
      return (
        <div className="group relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            title={`Assigned to ${currentAssignee.displayName || 'Unknown'}`}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={currentAssignee.avatarUrl || undefined} />
              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                {getInitials(currentAssignee.displayName)}
              </AvatarFallback>
            </Avatar>
          </button>
          {isOpen && (
            <div className="absolute z-50 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg">
              <div className="p-2 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Assigned to</span>
                  <button
                    onClick={handleUnassign}
                    disabled={isLoading}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    Unassign
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={currentAssignee.avatarUrl || undefined} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                      {getInitials(currentAssignee.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white">
                    {currentAssignee.displayName || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 hover:bg-slate-700 rounded transition-colors"
        title="Assign to team member"
      >
        <User className="w-4 h-4 text-slate-400" />
      </button>
    )
  }

  // Full variant - shows complete selector
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">Assigned To</label>
      {currentAssignee ? (
        <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentAssignee.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400">
              {getInitials(currentAssignee.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              {currentAssignee.displayName || 'Unknown'}
            </div>
            <div className="text-xs text-slate-400">Assignee</div>
          </div>
          <Button
            onClick={handleUnassign}
            disabled={isLoading}
            variant="ghost"
            size="icon-sm"
            className="hover:bg-red-500/10 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Select
          value=""
          onValueChange={handleAssign}
          disabled={isLoading || !members}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team member..." />
          </SelectTrigger>
          <SelectContent>
            {members?.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage
                      src={member.avatarUrl || member.imageUrl || undefined}
                    />
                    <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                      {getInitials(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.displayName || member.email}</span>
                </div>
              </SelectItem>
            ))}
            {(!members || members.length === 0) && (
              <div className="px-2 py-3 text-sm text-slate-400 text-center">
                No team members found
              </div>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
