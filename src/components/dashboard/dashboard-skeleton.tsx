import { Card } from "@/components/ui/card";
import { AlertTriangle, Sparkles, RefreshCw } from "lucide-react";

// StatCard Skeleton
export function StatCardSkeleton() {
  return (
    <div className="h-[120px] p-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl">
      <div className="flex flex-col h-full">
        {/* Header with label and sparkline */}
        <div className="flex items-start justify-between mb-2">
          <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
          <div className="h-6 w-14 bg-slate-700 rounded animate-pulse" />
        </div>

        {/* Value */}
        <div className="h-9 w-32 bg-slate-700 rounded animate-pulse mb-1" />

        {/* Trend */}
        <div className="h-5 w-28 bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

// UrgentActions Skeleton
export function UrgentActionsSkeleton() {
  return (
    <Card className="border-l-4 border-l-amber-500 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
        <div className="ml-auto h-6 w-8 bg-slate-700 rounded-full animate-pulse" />
      </div>

      {/* 3 placeholder rows */}
      <div className="divide-y divide-slate-700/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            {/* Status dot */}
            <div className="flex-shrink-0 mt-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="flex-shrink-0 h-6 w-24 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Action button */}
            <div className="flex-shrink-0">
              <div className="h-8 w-20 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// PipelineSummary Skeleton
export function PipelineSummarySkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="h-6 w-40 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Stacked Bar placeholder */}
      <div className="px-6 pb-4">
        <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* Legend */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700 animate-pulse" />
              <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="text-right">
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// AIDigest Skeleton
export function AIDigestSkeleton() {
  return (
    <Card className="border-l-4 border-l-blue-500 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-blue-400" />
        <div className="h-5 w-32 bg-slate-700 rounded animate-pulse flex-1" />
        <div className="h-8 w-8 rounded bg-slate-700 animate-pulse" />
      </div>

      {/* 2 insight placeholders */}
      <div className="divide-y divide-slate-700/50">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            {/* Status dot */}
            <div className="flex-shrink-0 mt-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-1.5">
                <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-64 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50">
        <div className="p-3 flex items-center justify-center gap-2">
          <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

// ActivityFeed Skeleton
export function ActivityFeedSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="h-6 w-44 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* 5 activity placeholders */}
      <div className="divide-y divide-slate-700/50">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            {/* Avatar circle */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
                </div>

                {/* Type icon */}
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 flex justify-center">
        <div className="h-8 w-24 bg-slate-700 rounded animate-pulse" />
      </div>
    </Card>
  );
}

// Composed Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <UrgentActionsSkeleton />
          <PipelineSummarySkeleton />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AIDigestSkeleton />
          <ActivityFeedSkeleton />
        </div>
      </div>
    </div>
  );
}
