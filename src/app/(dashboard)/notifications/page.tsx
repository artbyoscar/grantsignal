"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import {
  AlertTriangle,
  FileCheck,
  Users,
  Target,
  Info,
  Plus,
} from "lucide-react";

const notificationIcons = {
  DEADLINE: AlertTriangle,
  OPPORTUNITY: Target,
  TEAM: Users,
  DOCUMENT: FileCheck,
  SYSTEM: Info,
};

const notificationColors = {
  DEADLINE: "text-amber-500 bg-amber-500/10",
  OPPORTUNITY: "text-blue-500 bg-blue-500/10",
  TEAM: "text-purple-500 bg-purple-500/10",
  DOCUMENT: "text-green-500 bg-green-500/10",
  SYSTEM: "text-slate-500 bg-slate-500/10",
};

export default function NotificationsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const utils = api.useUtils();

  const { data, isLoading } = api.notifications.getNotifications.useQuery({
    limit: 50,
    offset: 0,
    unreadOnly: false,
  });

  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const createNotificationMutation = api.notifications.createNotification.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      setShowCreateForm(false);
    },
  });

  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleCreateTestNotification = (type: keyof typeof notificationIcons) => {
    const testMessages = {
      DEADLINE: {
        title: "Grant deadline approaching",
        message: "The Foundation ABC grant application is due in 3 days.",
        linkUrl: "/pipeline",
      },
      OPPORTUNITY: {
        title: "New opportunity match",
        message: "Found 5 new funding opportunities matching your programs.",
        linkUrl: "/opportunities",
      },
      TEAM: {
        title: "Team member mentioned you",
        message: "Sarah Johnson mentioned you in a note on the XYZ Grant.",
        linkUrl: "/pipeline",
      },
      DOCUMENT: {
        title: "Document processing complete",
        message: "Annual Report 2023.pdf has been processed and indexed.",
        linkUrl: "/documents",
      },
      SYSTEM: {
        title: "System maintenance scheduled",
        message: "GrantSignal will be undergoing maintenance tonight at 2 AM EST.",
        linkUrl: null,
      },
    };

    const message = testMessages[type];
    createNotificationMutation.mutate({
      type,
      title: message.title,
      message: message.message,
      linkUrl: message.linkUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-400">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Mark all as read
            </Button>
          )}
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Test Notification
          </Button>
        </div>
      </div>

      {/* Create Test Notification Form */}
      {showCreateForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Create Test Notification
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(notificationIcons) as Array<keyof typeof notificationIcons>).map(
              (type) => {
                const Icon = notificationIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleCreateTestNotification(type)}
                    disabled={createNotificationMutation.isPending}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors ${notificationColors[type]}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-white capitalize">
                      {type.toLowerCase()}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="rounded-lg border border-slate-700 bg-slate-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-400">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Info className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-medium text-white">No notifications yet</p>
            <p className="text-xs text-slate-400 text-center mt-1">
              Create a test notification above to see how they appear
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    notification.isRead
                      ? "hover:bg-slate-700/30"
                      : "bg-slate-700/20 hover:bg-slate-700/40"
                  }`}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-sm ${
                          notification.isRead
                            ? "text-slate-300"
                            : "font-semibold text-white"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {notification.linkUrl && (
                        <a
                          href={notification.linkUrl}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                    <button
                      onClick={() =>
                        markAsReadMutation.mutate({
                          notificationId: notification.id,
                        })
                      }
                      disabled={markAsReadMutation.isPending}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
