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
  sparklineData?: number[];
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  sparklineData,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`
        h-[120px] p-6
        bg-slate-800/50 backdrop-blur
        border border-slate-700 rounded-xl
        hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10
        transition-all
        ${onClick ? "cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        {/* Header with label and sparkline */}
        <div className="flex items-start justify-between mb-2">
          <span className="text-slate-400 text-sm font-medium">{label}</span>
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline
              data={sparklineData}
              width={60}
              height={24}
              color="#3b82f6"
            />
          )}
        </div>

        {/* Value */}
        <div className="text-3xl font-bold text-slate-100 mb-1">{value}</div>

        {/* Trend */}
        {trend && (
          <div
            className={`
              flex items-center gap-1 text-sm
              ${
                trend.direction === "up"
                  ? "text-emerald-400"
                  : trend.direction === "down"
                    ? "text-red-400"
                    : "text-slate-400"
              }
            `}
          >
            {trend.direction === "up" && <ChevronUp className="w-4 h-4" />}
            {trend.direction === "down" && <ChevronDown className="w-4 h-4" />}
            <span>
              {trend.value} {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
