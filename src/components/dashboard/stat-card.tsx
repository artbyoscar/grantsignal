import { ChevronDown, ChevronUp } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    label: string;
  };
  trendLabel?: string;
  sparklineData?: number[];
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  sparklineData,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`
        h-[80px] p-3
        bg-slate-800 backdrop-blur
        border border-slate-700 rounded-md
        hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10
        transition-all
        ${onClick ? "cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Header with label and sparkline */}
        <div className="flex items-start justify-between">
          <span className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">{label}</span>
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline
              data={sparklineData}
              width={48}
              height={24}
              color="#3b82f6"
            />
          )}
        </div>

        {/* Value */}
        <div className="text-[28px] font-semibold text-slate-50 leading-none">{value}</div>

        {/* Trend */}
        {trend && (
          <div
            className={`
              flex items-center gap-1 text-[11px]
              ${
                trend.direction === "up"
                  ? "text-emerald-400"
                  : trend.direction === "down"
                    ? "text-red-400"
                    : "text-slate-400"
              }
            `}
          >
            {trend.direction === "up" && <ChevronUp className="w-3 h-3" />}
            {trend.direction === "down" && <ChevronDown className="w-3 h-3" />}
            <span>
              {trend.value} {trend.label}
            </span>
          </div>
        )}
        {trendLabel && !trend && (
          <div className="text-[11px] text-slate-400">
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  );
}
