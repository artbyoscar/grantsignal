'use client'

import { useState } from 'react'
import { UserPlus, MoreVertical, Clock, Award } from 'lucide-react'
import { api } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InviteMemberModal } from '@/components/team/invite-member-modal'
import { EditRoleModal } from '@/components/team/edit-role-modal'
import { RemoveMemberDialog } from '@/components/team/remove-member-dialog'
import { formatDistanceToNow } from 'date-fns'
import { UserRole } from '@/types/client-types'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'

// Team Member Card Skeleton
function TeamMemberSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      <div className="mb-4">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

// Team Page Loading Skeleton
function TeamPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Member Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TeamMemberSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{
    id: string
    displayName: string
    email: string
    role: UserRole
  } | null>(null)

  const { data: members, isLoading, error, refetch } = api.team.listMembers.useQuery()
  const { data: grantCounts } = api.team.getMemberGrantCounts.useQuery()
  const { data: invitations } = api.team.listInvitations.useQuery()

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'MEMBER':
        return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'VIEWER':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  const getInitials = (firstName: string, lastName: string, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const handleEditRole = (member: any) => {
    setSelectedMember({
      id: member.id,
      displayName: `${member.firstName} ${member.lastName}`.trim() || member.email,
      email: member.email,
      role: member.role,
    })
    setEditRoleModalOpen(true)
  }

  const handleRemoveMember = (member: any) => {
    setSelectedMember({
      id: member.id,
      displayName: `${member.firstName} ${member.lastName}`.trim() || member.email,
      email: member.email,
      role: member.role,
    })
    setRemoveMemberDialogOpen(true)
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <ErrorState
          title="Failed to load team members"
          message={error.message || 'An error occurred while loading your team. Please try again.'}
          onRetry={() => refetch()}
          className="min-h-[50vh]"
        />
      </div>
    )
  }

  if (isLoading) {
    return <TeamPageSkeleton />
  }

  const totalMembers = (members?.length || 0) + (invitations?.length || 0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Team</h1>
          <p className="text-slate-400 mt-1">
            {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
            {invitations && invitations.length > 0 && (
              <span className="text-slate-500">
                {' '}
                ({invitations.length} pending invite{invitations.length === 1 ? '' : 's'})
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Active Members Grid */}
      {members && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {members.map((member) => {
            const fullName = `${member.firstName} ${member.lastName}`.trim()
            const displayName = fullName || member.email
            const grantCount = grantCounts?.[member.id] || 0

            return (
              <div
                key={member.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={member.imageUrl} alt={displayName} />
                    <AvatarFallback className="bg-slate-700 text-slate-200 text-lg">
                      {getInitials(member.firstName, member.lastName, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRole(member)}>
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-400 focus:text-red-400"
                      >
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-slate-100 mb-1">{displayName}</h3>
                  <p className="text-sm text-slate-400 truncate">{member.email}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                      {member.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Award className="w-4 h-4" />
                    <span>
                      {grantCount} {grantCount === 1 ? 'grant' : 'grants'} assigned
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Pending Invitations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-slate-700/50 text-slate-400 text-lg">
                      {invite.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-slate-300 mb-1 truncate">{invite.email}</h3>
                  <p className="text-sm text-slate-500">Invitation pending</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Badge className={getRoleBadgeColor(invite.role)} variant="outline">
                      {invite.role}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-500">
                    Invited {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!members || members.length === 0) && (!invitations || invitations.length === 0) && (
        <div className="text-center py-12">
          <UserPlus className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No team members yet</h3>
          <p className="text-slate-500 mb-6">
            Start building your team by inviting members to collaborate on grants.
          </p>
          <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Your First Team Member
          </Button>
        </div>
      )}

      {/* Modals */}
      <InviteMemberModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      {selectedMember && (
        <>
          <EditRoleModal
            open={editRoleModalOpen}
            onOpenChange={setEditRoleModalOpen}
            member={selectedMember}
          />
          <RemoveMemberDialog
            open={removeMemberDialogOpen}
            onOpenChange={setRemoveMemberDialogOpen}
            member={selectedMember}
          />
        </>
      )}
    </div>
  )
}
