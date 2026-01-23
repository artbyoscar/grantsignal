'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'

const ONBOARDING_PATHS = [
  '/onboarding',
  '/onboarding/organization',
  '/onboarding/documents',
  '/onboarding/programs',
  '/onboarding/team',
  '/onboarding/complete',
  '/onboarding/processing',
]

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: orgStatus, isLoading } = api.onboarding.getStatus.useQuery()

  useEffect(() => {
    if (isLoading || !orgStatus) return

    const isOnboardingPath = ONBOARDING_PATHS.some(path => pathname.startsWith(path))

    // If user hasn't completed onboarding and is not on an onboarding path
    if (!orgStatus.onboardingCompleted && !isOnboardingPath) {
      // Redirect to the appropriate onboarding step
      const step = orgStatus.onboardingStep || 1
      switch (step) {
        case 1:
          router.push('/onboarding')
          break
        case 2:
          router.push('/onboarding/organization')
          break
        case 3:
          router.push('/onboarding/documents')
          break
        case 4:
          router.push('/onboarding/programs')
          break
        case 5:
          router.push('/onboarding/team')
          break
        case 6:
          router.push('/onboarding/complete')
          break
        default:
          router.push('/onboarding')
      }
    }

    // If user has completed onboarding and is on an onboarding path
    if (orgStatus.onboardingCompleted && isOnboardingPath) {
      router.push('/dashboard')
    }
  }, [orgStatus, isLoading, pathname, router])

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
