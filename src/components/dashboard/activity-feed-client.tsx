"use client";

import { api } from "@/lib/trpc/client";
import { ActivityFeed, type ActivityItem } from "./activity-feed";

/**
 * Map activity log action strings to ActivityItem types
 */
function mapActionToType(action: string): ActivityItem['type'] {
  if (action.startsWith('document')) return 'document_upload';
  if (action.includes('status')) return 'status_change';
  if (action.startsWith('ai') || action.startsWith('writing')) return 'ai_generation';
  if (action.startsWith('team')) return 'comment';
  if (action.includes('budget') || action.includes('commitment')) return 'budget_update';
  return 'status_change';
}

interface ActivityFeedClientProps {
  initialActivities: ActivityItem[];
}

export function ActivityFeedClient({ initialActivities }: ActivityFeedClientProps) {
  const { data } = api.dashboard.getRecentActivity.useQuery(
    { limit: 10 },
  );

  // Transform ActivityLog records into ActivityItem format
  const activities: ActivityItem[] = data?.items
    ? data.items.map((item) => ({
        id: item.id,
        type: mapActionToType(item.action),
        actor: {
          name: item.userId || 'System',
        },
        description: item.description,
        grantName: item.entityType === 'grant' ? (item.metadata as Record<string, string> | null)?.grantName : undefined,
        timestamp: new Date(item.createdAt),
      }))
    : initialActivities;

  const hasMore = !!data?.nextCursor;

  const handleLoadMore = () => {
    // Could implement cursor-based pagination here
  };

  return (
    <ActivityFeed
      activities={activities}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
    />
  );
}
