import { Upload, ArrowRight, Sparkles, MessageSquare, DollarSign, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  type: 'document_upload' | 'status_change' | 'ai_generation' | 'comment' | 'budget_update';
  actor: { name: string; avatarUrl?: string };
  description: string;
  grantName?: string;
  timestamp: Date;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  onLoadMore: () => void;
  hasMore: boolean;
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
  document_upload: Upload,
  status_change: ArrowRight,
  ai_generation: Sparkles,
  comment: MessageSquare,
  budget_update: DollarSign,
};

/**
 * Formats a timestamp as relative time
 * - < 1 hour: "Just now"
 * - < 24 hours: "X hours ago"
 * - Yesterday: "Yesterday at X:XX PM"
 * - Older: "Jan 15, 4:30 PM"
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour
  if (diffHours < 1) {
    return "Just now";
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `Yesterday at ${time}`;
  }

  // Older
  const formatted = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return formatted;
}

/**
 * Gets initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ActivityFeed({ activities, onLoadMore, hasMore }: ActivityFeedProps) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-slate-100">
          Recent Activity Feed
        </h2>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-slate-700/50">
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type];
          const initials = getInitials(activity.actor.name);

          return (
            <div
              key={activity.id}
              className="p-4 flex items-start gap-3 hover:bg-slate-800/30 transition-colors"
            >
              {/* Avatar or initials fallback */}
              <div className="flex-shrink-0">
                {activity.actor.avatarUrl ? (
                  <img
                    src={activity.actor.avatarUrl}
                    alt={activity.actor.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-sm font-medium">
                    {initials}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-slate-100">
                        {activity.actor.name}
                      </span>{' '}
                      <span className="text-slate-300">
                        {activity.description}
                      </span>
                      {activity.grantName && (
                        <>
                          {' '}
                          <span className="text-slate-400">
                            "{activity.grantName}"
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>

                  {/* Type icon */}
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with Load More button */}
      {hasMore && (
        <div className="p-4 border-t border-slate-700/50 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="text-slate-300 hover:text-slate-100"
          >
            Load more
          </Button>
        </div>
      )}
    </Card>
  );
}
