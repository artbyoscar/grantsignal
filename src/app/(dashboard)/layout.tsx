import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingGuard } from '@/components/onboarding/onboarding-guard'
import { ConditionalSidebarLayout } from '@/components/onboarding/conditional-sidebar-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <OnboardingGuard>
      <ConditionalSidebarLayout>
        {children}
      </ConditionalSidebarLayout>
    </OnboardingGuard>
  )
}
