'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'

interface ConditionalSidebarLayoutProps {
  children: React.ReactNode
}

export function ConditionalSidebarLayout({ children }: ConditionalSidebarLayoutProps) {
  const pathname = usePathname()
  const isOnboardingPath = pathname.startsWith('/onboarding')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (isOnboardingPath) {
    return <>{children}</>
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">GrantSignal</h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeSidebar}
        />
      )}

      <div className="flex pt-14 md:pt-0">
        {/* Desktop Sidebar (always visible) */}
        <div className="hidden md:block">
          <Sidebar onNavigate={closeSidebar} />
        </div>

        {/* Mobile Sidebar (slide-out drawer) */}
        <div
          className={`
            md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onNavigate={closeSidebar} />
        </div>

        <main className="flex-1 p-4 md:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
