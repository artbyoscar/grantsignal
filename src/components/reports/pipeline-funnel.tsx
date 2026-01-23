'use client'

import { TrendingUp } from 'lucide-react'

interface PipelineFunnelProps {
  stages: { name: string; value: number; count: number; color: string }[]
  total: number
}

export function PipelineFunnel({ stages, total }: PipelineFunnelProps) {
  // Calculate percentages for horizontal stacked bar
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Pipeline Value by Stage</h2>
        <span className="text-xs text-slate-400">
          {stages.reduce((sum, stage) => sum + stage.count, 0)} grants
        </span>
      </div>

      {stages.length === 0 ? (
        <div className="h-[120px] flex flex-col items-center justify-center text-slate-400">
          <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-xs">No pipeline data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Horizontal stacked bar */}
          <div className="flex w-full h-8 rounded-md overflow-hidden">
            {stages.map((stage) => {
              const widthPercentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0

              return (
                <div
                  key={stage.name}
                  className="relative group transition-all duration-200 hover:opacity-80"
                  style={{
                    backgroundColor: stage.color,
                    width: `${widthPercentage}%`,
                  }}
                  title={`${stage.name}: $${stage.value >= 1000000
                    ? `${(stage.value / 1000000).toFixed(1)}M`
                    : `${(stage.value / 1000).toFixed(0)}K`
                  } (${stage.count} grants)`}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {stages.map((stage) => {
              const formattedValue = stage.value >= 1000000
                ? `$${(stage.value / 1000000).toFixed(1)}M`
                : `$${(stage.value / 1000).toFixed(0)}K`

              return (
                <div key={stage.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-xs text-slate-300 truncate">{stage.name}</span>
                      <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">
                        {formattedValue}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{stage.count} grants</span>
                  </div>
                </div>
              )
            })}
          </div>
      </div>
      )}

      {/* Total section */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Pipeline Value</span>
          <span className="text-lg font-bold text-white">
            ${total >= 1000000
              ? `${(total / 1000000).toFixed(1)}M`
              : `${(total / 1000).toFixed(0)}K`
            }
          </span>
        </div>
      </div>
    </div>
  )
}
