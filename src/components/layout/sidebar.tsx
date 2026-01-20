'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Kanban,
  FileText,
  Shield,
  Settings,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/compliance', label: 'Compliance', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">GrantSignal</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-700/50 text-white border-l-2 border-blue-500 -ml-[2px] pl-[14px]"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">N</span>
          </div>
          <span className="text-sm text-slate-300">Oscar</span>
        </div>
      </div>
    </aside>
  )
}
