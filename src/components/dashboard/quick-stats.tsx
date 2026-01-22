import { StatCard } from "./stat-card";

interface DashboardStats {
  activeGrants: {
    count: number;
    trend: number;
    trendPeriod: string;
    sparkline: number[];
  };
  pendingDecisions: {
    count: number;
    dueThisWeek: number;
  };
  ytdAwarded: {
    amount: number;
    trend: number;
    sparkline: number[];
  };
  winRate: {
    percentage: number;
    trend: number;
    sparkline: number[];
  };
}

interface QuickStatsProps {
  stats: DashboardStats;
}

export function QuickStats({ stats }: QuickStatsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Grants */}
      <StatCard
        label="Active Grants"
        value={stats.activeGrants.count.toLocaleString()}
        trend={{
          direction: stats.activeGrants.trend >= 0 ? "up" : "down",
          value: Math.abs(stats.activeGrants.trend).toString(),
          label: stats.activeGrants.trendPeriod,
        }}
        sparklineData={stats.activeGrants.sparkline}
      />

      {/* Pending Decisions */}
      <StatCard
        label="Pending Decisions"
        value={stats.pendingDecisions.count.toLocaleString()}
        trendLabel={`${stats.pendingDecisions.dueThisWeek} due this week`}
      />

      {/* YTD Awarded */}
      <StatCard
        label="YTD Awarded"
        value={formatCurrency(stats.ytdAwarded.amount)}
        trend={{
          direction: stats.ytdAwarded.trend >= 0 ? "up" : "down",
          value: Math.abs(stats.ytdAwarded.trend).toString(),
          label: "vs last year",
        }}
        sparklineData={stats.ytdAwarded.sparkline}
      />

      {/* Win Rate */}
      <StatCard
        label="Win Rate"
        value={formatPercentage(stats.winRate.percentage)}
        trend={{
          direction: stats.winRate.trend >= 0 ? "up" : "down",
          value: Math.abs(stats.winRate.trend).toString(),
          label: "percentage points",
        }}
        sparklineData={stats.winRate.sparkline}
      />
    </div>
  );
}
