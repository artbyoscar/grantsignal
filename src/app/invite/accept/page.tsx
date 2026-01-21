'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { api } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userId, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [accepted, setAccepted] = useState(false)

  const token = searchParams?.get('token') || ''

  // Fetch invitation details
  const {
    data: invitation,
    isLoading: inviteLoading,
    error: inviteError,
  } = api.team.getInviteDetails.useQuery(
    { token },
    {
      enabled: !!token,
    }
  )

  // Accept invitation mutation
  const acceptMutation = api.team.acceptInvite.useMutation({
    onSuccess: () => {
      setAccepted(true)
      toast.success('Welcome to the team!')
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Auto-accept if user is already signed in
  useEffect(() => {
    if (authLoaded && userLoaded && userId && invitation && !accepted && !acceptMutation.isPending) {
      acceptMutation.mutate({
        token,
        clerkUserId: userId,
      })
    }
  }, [authLoaded, userLoaded, userId, invitation, accepted, token])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invitation</h1>
          <p className="text-slate-600">
            This invitation link is invalid. Please check your email for the correct link.
          </p>
        </div>
      </div>
    )
  }

  if (inviteLoading || !authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invitation Error</h1>
          <p className="text-slate-600 mb-4">{inviteError.message}</p>
          <Link href="/sign-in">
            <Button>Go to Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (accepted || acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to the Team!</h1>
          <p className="text-slate-600 mb-4">
            You've successfully joined <strong>{invitation.organizationName}</strong> as a{' '}
            <strong>{invitation.role.toLowerCase()}</strong>.
          </p>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    // User is not signed in - show sign up page
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Invited!</h1>
            <p className="text-slate-600">
              You've been invited to join <strong>{invitation.organizationName}</strong>
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Role</p>
                <p className="text-sm text-slate-600">{invitation.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <p className="text-sm text-slate-600">{invitation.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href={`/sign-up?redirect_url=${encodeURIComponent(`/invite/accept?token=${token}`)}`}>
              <Button className="w-full" size="lg">
                Create Account & Accept
              </Button>
            </Link>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/accept?token=${token}`)}`}>
              <Button variant="outline" className="w-full" size="lg">
                Sign In to Accept
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500 text-center mt-4">
            This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }

  // User is signed in, accepting invitation
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Accepting Invitation...</h1>
        <p className="text-slate-600">Please wait while we add you to the team.</p>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
