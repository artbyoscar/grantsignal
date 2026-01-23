'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Mail, X, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type InviteDraft = {
  email: string
  role: 'ADMIN' | 'MEMBER' | 'VIEWER'
}

export default function TeamOnboardingPage() {
  const router = useRouter()
  const updateStep = api.onboarding.updateStep.useMutation()
  const inviteMember = api.team.inviteMember.useMutation()
  const { data: invitations, refetch } = api.team.listInvitations.useQuery()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingInvites, setPendingInvites] = useState<InviteDraft[]>([])

  const handleSendInvite = async () => {
    // Validate
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        await inviteMember.mutateAsync({ email, role })
        setPendingInvites([...pendingInvites, { email, role }])
        setEmail('')
        setRole('MEMBER')
        await refetch()
      } catch (error) {
        if (error instanceof Error) {
          setErrors({ email: error.message })
        }
      }
    }
  }

  const handleContinue = async () => {
    try {
      await updateStep.mutateAsync({ step: 6 })
      router.push('/onboarding/complete')
    } catch (error) {
      console.error('Failed to update step:', error)
    }
  }

  const handleSkip = async () => {
    try {
      await updateStep.mutateAsync({ step: 6 })
      router.push('/onboarding/complete')
    } catch (error) {
      console.error('Failed to skip:', error)
    }
  }

  const handleBack = async () => {
    await updateStep.mutateAsync({ step: 4 })
    router.push('/onboarding/programs')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'MEMBER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'VIEWER':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Can manage grants, team, and settings'
      case 'MEMBER':
        return 'Can view and edit grants'
      case 'VIEWER':
        return 'Read-only access to grants'
      default:
        return ''
    }
  }

  const totalInvites = (invitations?.length || 0) + pendingInvites.length

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 5 of 6</span>
          </div>
          <Progress value={83} />
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Invite Your Team</h1>
            <p className="text-slate-400">
              Collaborate on grants with your team members. You can always invite more people later.
            </p>
          </div>

          {/* Invite Form */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Send an Invitation</h2>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSendInvite()
                    }
                  }}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-slate-400">
                        Can manage grants, team, and settings
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEMBER">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-slate-400">Can view and edit grants</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex flex-col items-start">
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-slate-400">Read-only access to grants</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={handleSendInvite}
              variant="outline"
              className="w-full"
              disabled={inviteMember.isPending}
            >
              <UserPlus className="w-4 h-4" />
              {inviteMember.isPending ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>

          {/* Pending Invitations */}
          {totalInvites > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">
                Pending Invitations ({totalInvites})
              </h3>
              <div className="space-y-2">
                {invitations?.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{invite.email}</div>
                        <div className="text-sm text-slate-400">{getRoleDescription(invite.role)}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(invite.role)}`}>
                      {invite.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-slate-300">
                Invitations are sent via email and expire in 7 days. Team members can manage their own notification preferences after joining.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={updateStep.isPending}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={updateStep.isPending}
              className="text-slate-400"
            >
              Skip for now
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={updateStep.isPending}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
