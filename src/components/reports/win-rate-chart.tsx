"use client";

import { Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  CartesianGrid,
} from "recharts";

interface WinRateChartProps {
  data: { month: string; rate: number }[];
  dateRange: string; // e.g., "Jul 2024 - Jan 2026"
}

export function WinRateChart({ data, dateRange }: WinRateChartProps) {
  // Get the current (last) value from data
  const currentValue = data.length > 0 ? data[data.length - 1].rate : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">
            Win Rate Over Time
          </h2>
          <button
            type="button"
            className="text-slate-400 hover:text-white transition-colors"
            title="Win rate percentage over time"
          >
            <Info className="h-3 w-3" />
          </button>
        </div>
        <div className="text-xs text-slate-400">{dateRange}</div>
      </div>

      {/* Current Value Display */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-blue-400">
          {currentValue.toFixed(0)}%
        </div>
        <div className="text-xs text-slate-400">Current Win Rate</div>
      </div>

      {/* Chart or Empty State */}
      {data.length === 0 ? (
        <div className="h-[140px] flex flex-col items-center justify-center text-slate-400">
          <Info className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-xs">No win rate data available</p>
        </div>
      ) : (
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={{ stroke: "#475569" }}
            />
            <YAxis
              domain={[0, 60]}
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={{ stroke: "#475569" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#e2e8f0", marginBottom: "4px" }}
              itemStyle={{ color: "#3b82f6" }}
              formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(1)}%`, "Win Rate"] : ['-', "Win Rate"]}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="none"
              fill="url(#colorRate)"
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{
                fill: "#3b82f6",
                r: 4,
                strokeWidth: 0,
              }}
              activeDot={{
                fill: "#3b82f6",
                r: 6,
                strokeWidth: 2,
                stroke: "#1e293b",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
