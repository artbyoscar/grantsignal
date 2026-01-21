'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

interface ConditionalSidebarLayoutProps {
  children: React.ReactNode
}

export function ConditionalSidebarLayout({ children }: ConditionalSidebarLayoutProps) {
  const pathname = usePathname()
  const isOnboardingPath = pathname.startsWith('/onboarding')

  if (isOnboardingPath) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
