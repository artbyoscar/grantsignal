"use client";

import { useState } from "react";
import { ActivityFeed, type ActivityItem } from "./activity-feed";

interface ActivityFeedClientProps {
  initialActivities: ActivityItem[];
}

export function ActivityFeedClient({ initialActivities }: ActivityFeedClientProps) {
  const [activities, setActivities] = useState(initialActivities);
  const [hasMore, setHasMore] = useState(false); // TODO: Implement pagination

  const handleLoadMore = () => {
    // TODO: Implement load more functionality
    console.log("Load more activities");
  };

  return (
    <ActivityFeed
      activities={activities}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
    />
  );
}
