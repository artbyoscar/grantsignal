'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Kanban,
  PenTool,
  Calendar,
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
import { NotificationBell } from '@/components/notifications/notification-bell'

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
    { href: '/write', label: 'Writer', icon: PenTool },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
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
        isCollapsed ? "w-14" : "w-[200px]"
      )}
    >
      {/* Logo Area */}
      <div className="hidden md:flex items-center justify-between h-12 px-3 border-b border-slate-800">
        {!isCollapsed && (
          <h1 className="text-[16px] font-semibold text-white">
            <span className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">GrantSignal</span>
          </h1>
        )}
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all duration-150"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      {/* Mobile Logo */}
      <div className="md:hidden p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Menu</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center h-9 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "text-blue-400 bg-blue-600/20"
                    : "text-slate-300 bg-transparent hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white",
                          item.badgeColor || "bg-blue-500"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-700 border border-slate-600 text-slate-200 text-[12px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                  {item.label}
                  {item.badge !== undefined && (
                    <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white", item.badgeColor || "bg-blue-500")}>
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
        <div className="p-3">
          <div className="relative group">
            <Link
              href="/settings"
              className={cn(
                "flex items-center h-9 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                isCollapsed ? "justify-center" : "gap-3",
                pathname === '/settings'
                  ? "text-blue-400 bg-blue-600/20"
                  : "text-slate-300 bg-transparent hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Settings className={cn("w-[18px] h-[18px] flex-shrink-0", pathname === '/settings' ? "text-blue-400" : "text-slate-400")} />
              {!isCollapsed && <span>Settings</span>}
            </Link>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-700 border border-slate-600 text-slate-200 text-[12px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                Settings
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 pt-0">
          <div className={cn(
            "flex items-center h-14 px-3 py-2 rounded-md",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-semibold text-white">O</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-200 truncate">Oscar</p>
                <p className="text-[10px] text-slate-400 truncate">View Profile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
