'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Kanban,
  FileText,
  Shield,
  BarChart3,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Fetch compliance summary for badge count
  const { data: complianceSummary } = api.compliance.getSummary.useQuery(undefined, {
    refetchInterval: 60000 // Refresh every minute
  })

  const unresolvedConflictsCount = complianceSummary?.unresolvedConflicts ?? 0

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/opportunities', label: 'Opportunities', icon: Search },
    { href: '/pipeline', label: 'Pipeline', icon: Kanban },
    { href: '/documents', label: 'Documents', icon: FileText },
    {
      href: '/compliance',
      label: 'Compliance',
      icon: Shield,
      badge: unresolvedConflictsCount > 0 ? unresolvedConflictsCount : undefined,
      badgeColor: 'bg-red-500'
    },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/team', label: 'Team', icon: Users },
  ]

  return (
    <aside
      className={cn(
        "h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-slate-800">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-white">
            <span className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">GrantSignal</span>
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-150"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Logo */}
      <div className="md:hidden p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Menu</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-500 rounded-l-none"
                    : "text-slate-400 bg-transparent hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
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
                  </>
                )}
                {isCollapsed && isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-slate-200 text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                  {item.label}
                  {item.badge !== undefined && (
                    <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold text-white", item.badgeColor || "bg-blue-500")}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-800">
        {/* Settings Link */}
        <div className="p-4">
          <div className="relative group">
            <Link
              href="/settings"
              className={cn(
                "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                isCollapsed ? "justify-center" : "gap-3",
                pathname === '/settings'
                  ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-500 rounded-l-none"
                  : "text-slate-400 bg-transparent hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Settings</span>}
              {isCollapsed && pathname === '/settings' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </Link>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-slate-200 text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                Settings
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 pt-0">
          <div className={cn(
            "flex items-center px-3 py-2 rounded-lg",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">O</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">Oscar</p>
                <p className="text-xs text-slate-400 truncate">View Profile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
