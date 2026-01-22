/**
 * Skeleton loading states for reports page
 */

/**
 * Generic chart placeholder with animated pulse
 * Used for all chart components (funnel, donut, bar charts, etc.)
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      {/* Chart header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-48 bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Chart body skeleton */}
      <div
        className="bg-slate-700 rounded animate-pulse"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}

/**
 * Skeleton for report type cards in the grid
 * Matches ReportTypeCard structure with title, description, and button
 */
export function ReportCardSkeleton() {
  return (
    <div className="relative overflow-hidden bg-slate-800 border border-slate-700 rounded-lg p-6">
      {/* Background gradient placeholder */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 blur-3xl" />

      <div className="relative">
        {/* Icon placeholder */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-slate-700 animate-pulse w-12 h-12" />
        </div>

        {/* Title placeholder */}
        <div className="h-6 w-3/4 bg-slate-700 rounded animate-pulse mb-2" />

        {/* Description placeholder (2 lines) */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse" />
        </div>

        {/* Button placeholder */}
        <div className="mt-4 h-5 w-32 bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Skeleton for stat cards (quick stats section)
 * Matches StatCard structure with label, value, and trend
 */
export function StatCardSkeleton() {
  return (
    <div className="h-[120px] p-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl">
      <div className="flex flex-col h-full">
        {/* Label */}
        <div className="h-4 w-24 bg-slate-700 rounded animate-pulse mb-2" />

        {/* Value */}
        <div className="h-8 w-32 bg-slate-700 rounded animate-pulse mb-1" />

        {/* Trend label */}
        <div className="h-3 w-28 bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Full page skeleton that composes all widget skeletons
 * Matches the layout structure in reports/page.tsx
 */
export function ReportsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="h-9 w-64 bg-slate-700 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Quick Stats Grid - 4 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Report Cards Grid - 5 report type cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(5)].map((_, i) => (
          <ReportCardSkeleton key={i} />
        ))}
      </div>

      {/* About section skeleton */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="h-6 w-40 bg-slate-700 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for report detail pages (monthly, executive summary, etc.)
 * Used when loading individual report views
 */
export function ReportDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div>
        <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-4" />
        <div className="h-9 w-80 bg-slate-700 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Export buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>
    </div>
  )
}
