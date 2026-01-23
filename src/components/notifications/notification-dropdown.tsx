'use client'

import { useEffect, useRef } from 'react'
import { Settings, Check } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/trpc/react'
import { NotificationItem } from './notification-item'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const utils = api.useUtils()

  const { data, isLoading } = api.notifications.getNotifications.useQuery({
    limit: 10,
    offset: 0,
    unreadOnly: false,
  })

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate()
      utils.notifications.getUnreadCount.invalidate()
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleMarkAllRead = async () => {
    await markAllAsReadMutation.mutateAsync()
  }

  const notifications = data?.notifications || []

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[360px] rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all read
            </button>
          )}
          <Link
            href="/settings/notifications"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            aria-label="Notification settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-slate-400">Loading...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Bell className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-white">All caught up!</p>
            <p className="text-xs text-slate-400">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-3">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  )
}

function Bell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}
