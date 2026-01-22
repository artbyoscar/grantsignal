import { Suspense } from "react";
import { api } from "@/lib/trpc/server";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { UrgentActionsPanel } from "@/components/dashboard/urgent-actions-panel";
import { PipelineSummary } from "@/components/dashboard/pipeline-summary";
import { ActivityFeedClient } from "@/components/dashboard/activity-feed-client";
import { AIDigestClient } from "@/components/dashboard/ai-digest-client";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

async function DashboardContent() {
  const caller = await api();

  // Fetch all data in parallel
  const [stats, urgentActions, pipelineStages, recentActivity, aiInsights] =
    await Promise.all([
      caller.dashboard.getStats(),
      caller.dashboard.getUrgentActions(),
      caller.dashboard.getPipelineStages(),
      caller.dashboard.getRecentActivity({ limit: 10 }),
      caller.dashboard.getAIInsights(),
    ]);

  return (
    <>
      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <UrgentActionsPanel actions={urgentActions} />
          <PipelineSummary stages={pipelineStages} />
          <ActivityFeedClient initialActivities={recentActivity} />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          <AIDigestClient initialInsights={aiInsights} />
          <QuickActionsPanel />
        </div>
      </div>
    </>
  );
}

// Loading skeleton components
function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <QuickStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Welcome back! Here's what's happening with your grants.
        </p>
      </div>

      {/* Dashboard Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
