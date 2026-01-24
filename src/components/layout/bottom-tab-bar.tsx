'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  FileText,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomTabBarProps {
  onMoreClick: () => void
}

export function BottomTabBar({ onMoreClick }: BottomTabBarProps) {
  const pathname = usePathname()

  const tabItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard'
    },
    {
      href: '/pipeline',
      label: 'Pipeline',
      icon: Kanban,
      isActive: pathname === '/pipeline'
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: Calendar,
      isActive: pathname === '/calendar'
    },
    {
      href: '/documents',
      label: 'Documents',
      icon: FileText,
      isActive: pathname === '/documents'
    },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {tabItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? 'page' : undefined}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-full px-2 transition-colors touch-manipulation",
                "active:bg-slate-800/50",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 mb-1",
                  item.isActive
                    ? "text-blue-400"
                    : "text-slate-400"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  item.isActive
                    ? "text-blue-400"
                    : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* More Button */}
        <button
          onClick={onMoreClick}
          aria-label="More navigation options"
          aria-haspopup="menu"
          className={cn(
            "flex flex-col items-center justify-center min-w-[60px] h-full px-2 transition-colors touch-manipulation",
            "active:bg-slate-800/50",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
          )}
        >
          <MoreHorizontal className="w-6 h-6 mb-1 text-slate-400" aria-hidden="true" />
          <span className="text-[10px] font-medium leading-none text-slate-400">
            More
          </span>
        </button>
      </div>
    </nav>
  )
}
