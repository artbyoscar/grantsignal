'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'
import { MobileDrawer } from '@/components/layout/mobile-drawer'
import { SkipLink } from '@/components/ui/skip-link'

interface ConditionalSidebarLayoutProps {
  children: React.ReactNode
}

export function ConditionalSidebarLayout({ children }: ConditionalSidebarLayoutProps) {
  const pathname = usePathname()
  const isOnboardingPath = pathname.startsWith('/onboarding')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  if (isOnboardingPath) {
    return <>{children}</>
  }

  const closeDrawer = () => setIsDrawerOpen(false)
  const openDrawer = () => setIsDrawerOpen(true)

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      <div className="min-h-screen bg-slate-900">
        {/* Mobile Header - Simplified (no hamburger, bottom nav handles navigation) */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            GrantSignal
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Mobile Drawer */}
        <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />

        <div className="flex pt-14 md:pt-0">
          {/* Desktop Sidebar (always visible) */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          <main id="main-content" className="flex-1 p-4 md:p-8 min-w-0 pb-20 md:pb-4">
            {children}
          </main>
        </div>

        {/* Bottom Tab Bar (mobile only) */}
        <BottomTabBar onMoreClick={openDrawer} />
      </div>
    </>
  )
}
