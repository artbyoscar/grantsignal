'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { api } from '@/trpc/react'
import { NotificationDropdown } from './notification-dropdown'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: unreadData } = api.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const unreadCount = unreadData?.count || 0

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
