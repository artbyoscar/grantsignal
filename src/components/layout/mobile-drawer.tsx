'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  PenTool,
  Shield,
  BarChart3,
  Users,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname()

  // Fetch compliance summary for badge count
  const { data: complianceSummary } = api.compliance.getSummary.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: isOpen // Only fetch when drawer is open
  })

  const unresolvedConflictsCount = complianceSummary?.unresolvedConflicts ?? 0

  const navItems = [
    { href: '/opportunities', label: 'Opportunities', icon: Search },
    { href: '/write', label: 'Writer', icon: PenTool },
    {
      href: '/compliance',
      label: 'Compliance',
      icon: Shield,
      badge: unresolvedConflictsCount > 0 ? unresolvedConflictsCount : undefined,
      badgeColor: 'bg-red-500'
    },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-900 border-r border-slate-800",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-white">
            <span className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">GrantSignal</span>
          </h1>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center h-12 px-4 rounded-lg text-sm font-medium transition-colors touch-manipulation",
                  "gap-3",
                  isActive
                    ? "text-blue-400 bg-blue-600/20"
                    : "text-slate-300 hover:text-slate-100 hover:bg-slate-800 active:bg-slate-700"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold text-white",
                      item.badgeColor || "bg-blue-500"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">O</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">Oscar</p>
              <p className="text-xs text-slate-400 truncate">View Profile</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
