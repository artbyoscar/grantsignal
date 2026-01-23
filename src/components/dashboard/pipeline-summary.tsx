"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, LayoutGrid } from "lucide-react";

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  amount: number;
  color: string;
}

export const STAGE_COLORS = {
  PROSPECT: "#f59e0b",
  RESEARCHING: "#3b82f6",
  WRITING: "#8b5cf6",
  REVIEW: "#06b6d4",
  SUBMITTED: "#6366f1",
  PENDING: "#f97316",
  AWARDED: "#22c55e",
  DECLINED: "#64748b",
} as const;

interface PipelineSummaryProps {
  stages: PipelineStage[];
}

export function PipelineSummary({ stages }: PipelineSummaryProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const router = useRouter();

  // Calculate totals
  const totalCount = stages.reduce((sum, stage) => sum + stage.count, 0);
  const totalAmount = stages.reduce((sum, stage) => sum + stage.amount, 0);

  // Show empty state if no grants
  if (totalCount === 0) {
    return (
      <Card>
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Pipeline Summary
          </h2>
        </div>
        <EmptyState
          icon={LayoutGrid}
          title="Your pipeline is empty"
          description="Start building your grant pipeline by adding your first grant opportunity."
          primaryAction={{
            label: "Add Grant",
            onClick: () => router.push("/pipeline"),
            icon: Plus,
          }}
          secondaryAction={{
            label: "Browse Opportunities",
            onClick: () => router.push("/opportunities"),
            variant: "outline",
          }}
          className="py-8"
        />
      </Card>
    );
  }

  // Format amount as $XK or $X.XM
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(amount / 1000)}K`;
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Pipeline Summary
        </h2>
      </div>

      {/* Stacked Bar Chart */}
      <div className="px-6 pb-4">
        <div className="relative h-12 rounded-lg overflow-hidden flex">
          {stages.map((stage) => {
            const widthPercentage =
              totalCount > 0 ? (stage.count / totalCount) * 100 : 0;
            const isHovered = hoveredStage === stage.id;

            return (
              <div
                key={stage.id}
                className="relative group cursor-pointer transition-all hover:opacity-90"
                style={{
                  width: `${widthPercentage}%`,
                  backgroundColor: stage.color,
                }}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => router.push(`/pipeline?stage=${stage.id}`)}
              >
                {/* Count label */}
                {widthPercentage > 8 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {stage.count}
                    </span>
                  </div>
                )}

                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-100 mb-1">
                        {stage.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {stage.count} grants · {formatAmount(stage.amount)}
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-slate-700" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-4">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs text-slate-400">{stage.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Total Pipeline</div>
            <div className="text-xl font-bold text-slate-100 mt-0.5">
              {totalCount} grants
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Total Value</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {formatAmount(totalAmount)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
