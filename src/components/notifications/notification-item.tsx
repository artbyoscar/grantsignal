'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  AlertTriangle,
  FileCheck,
  Users,
  Target,
  Info,
  ExternalLink,
} from 'lucide-react'
import { api } from '@/trpc/react'
import type { InAppNotificationType } from '@prisma/client'

interface Notification {
  id: string
  type: InAppNotificationType
  title: string
  message: string
  linkUrl: string | null
  isRead: boolean
  createdAt: Date
}

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

const notificationIcons = {
  DEADLINE: AlertTriangle,
  OPPORTUNITY: Target,
  TEAM: Users,
  DOCUMENT: FileCheck,
  SYSTEM: Info,
}

const notificationColors = {
  DEADLINE: 'text-amber-500',
  OPPORTUNITY: 'text-blue-500',
  TEAM: 'text-purple-500',
  DOCUMENT: 'text-green-500',
  SYSTEM: 'text-slate-500',
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const utils = api.useUtils()
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate()
      utils.notifications.getUnreadCount.invalidate()
    },
  })

  const Icon = notificationIcons[notification.type]
  const iconColor = notificationColors[notification.type]

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync({ notificationId: notification.id })
    }
    if (notification.linkUrl) {
      onClose()
    }
  }

  const content = (
    <div
      className={`flex gap-3 px-4 py-3 transition-colors ${
        notification.isRead
          ? 'hover:bg-slate-700/50'
          : 'bg-slate-700/30 hover:bg-slate-700/50'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-sm ${
              notification.isRead ? 'text-slate-300' : 'font-semibold text-white'
            }`}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Action */}
      {notification.linkUrl && (
        <div className="flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  )

  if (notification.linkUrl) {
    return (
      <Link href={notification.linkUrl} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={handleClick} className="w-full text-left">
      {content}
    </button>
  )
}
