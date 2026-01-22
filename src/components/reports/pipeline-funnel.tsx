'use client'

interface PipelineFunnelProps {
  stages: { name: string; value: number; count: number; color: string }[]
  total: number
}

export function PipelineFunnel({ stages, total }: PipelineFunnelProps) {
  // Calculate the maximum width for the funnel (first/widest stage)
  const maxValue = Math.max(...stages.map(s => s.value))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Pipeline Value by Stage</h2>
        <span className="text-sm text-slate-400">
          {stages.reduce((sum, stage) => sum + stage.count, 0)} grants
        </span>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercentage = (stage.value / maxValue) * 100
          const formattedValue = stage.value >= 1000000
            ? `$${(stage.value / 1000000).toFixed(1)}M`
            : `$${(stage.value / 1000).toFixed(0)}K`

          return (
            <div key={stage.name} className="relative">
              {/* Stage bar */}
              <div
                className="relative rounded-lg transition-all duration-300 hover:opacity-90"
                style={{
                  backgroundColor: stage.color,
                  width: `${widthPercentage}%`,
                  minHeight: '60px',
                }}
              >
                {/* Stage content */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <span className="font-medium text-white">{stage.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">{formattedValue}</span>
                    <span className="text-sm text-white/80">{stage.count} grants</span>
                  </div>
                </div>
              </div>

              {/* Connector line to next stage */}
              {index < stages.length - 1 && (
                <div
                  className="h-2 bg-slate-700/50"
                  style={{
                    width: `${((stages[index + 1].value / maxValue) * 100)}%`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Total section */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Total Pipeline Value</span>
          <span className="text-2xl font-bold text-white">
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
