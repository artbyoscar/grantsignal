import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingGuard } from '@/components/onboarding/onboarding-guard'
import { ConditionalSidebarLayout } from '@/components/onboarding/conditional-sidebar-layout'
import { CommandPaletteProvider } from '@/components/command-palette/command-palette-provider'

export const dynamic = 'force-dynamic'

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
      <CommandPaletteProvider>
        <ConditionalSidebarLayout>
          {children}
        </ConditionalSidebarLayout>
      </CommandPaletteProvider>
    </OnboardingGuard>
  )
}
