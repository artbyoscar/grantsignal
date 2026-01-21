import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
  trendLabel?: string;
  sparklineData?: number[];
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  sparklineData,
  className,
}: StatCardProps) {
  // Check if value is a number to apply JetBrains Mono font
  const isNumeric = typeof value === "number" || !isNaN(Number(value));

  return (
    <div
      className={cn(
        "group relative h-[120px] rounded-xl border border-slate-700/50 bg-slate-800/60 p-6",
        "transition-all duration-300 ease-out",
        "hover:border-blue-500/30 hover:bg-slate-800/80",
        "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
        className
      )}
    >
      {/* Label */}
      <div className="mb-2 text-sm font-medium text-slate-400">{label}</div>

      {/* Value */}
      <div
        className={cn(
          "mb-3 text-3xl font-bold text-white",
          isNumeric && "font-mono"
        )}
      >
        {value}
      </div>

      {/* Trend Row */}
      {trend && (
        <div className="flex items-center gap-2 text-sm">
          {/* Trend Arrow and Percentage */}
          <div
            className={cn(
              "flex items-center gap-1 font-medium",
              trend.direction === "up"
                ? "text-emerald-400"
                : "text-red-400"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            <span>{trend.percentage}%</span>
          </div>

          {/* Trend Label */}
          {trendLabel && (
            <span className="text-slate-500">{trendLabel}</span>
          )}
        </div>
      )}

      {/* Optional Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute right-6 top-6 h-12 w-20 opacity-40">
          <MiniSparkline data={sparklineData} />
        </div>
      )}
    </div>
  );
}

// Mini sparkline component for visual data representation
function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Calculate points for the SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-400"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
