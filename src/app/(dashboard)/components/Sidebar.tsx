'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Kanban, FileText, Shield } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/compliance', label: 'Compliance', icon: Shield },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
  userInitial?: string
}

export function Sidebar({ userName, userEmail, userInitial }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-800 border-r border-slate-700 p-4 flex flex-col">
      <div className="text-xl font-bold text-white mb-8">GrantSignal</div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive
                  ? 'bg-slate-700/50 text-white border-l-2 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-white' : 'text-slate-400'}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User section at bottom */}
      <div className="mt-auto pt-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {userInitial || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {userName || 'User'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {userEmail || 'user@example.com'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
