import { cn } from "@/lib/utils"

const stages = [
  { name: 'Prospect', count: 0, color: 'bg-slate-500' },
  { name: 'Researching', count: 0, color: 'bg-purple-500' },
  { name: 'Writing', count: 0, color: 'bg-blue-500' },
  { name: 'Submitted', count: 0, color: 'bg-cyan-500' },
  { name: 'Pending', count: 0, color: 'bg-orange-500' },
  { name: 'Awarded', count: 0, color: 'bg-emerald-500' },
]

export function PipelineSummary() {
  const totalGrants = stages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Pipeline Summary</h2>
        <span className="text-sm text-slate-400">{totalGrants} grants</span>
      </div>

      {/* Pipeline bar */}
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
        {totalGrants === 0 ? (
          <div className="w-full bg-slate-600" />
        ) : (
          stages.map((stage) => (
            stage.count > 0 && (
              <div
                key={stage.name}
                className={cn(stage.color)}
                style={{ width: `${(stage.count / totalGrants) * 100}%` }}
              />
            )
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", stage.color)} />
            <span className="text-xs text-slate-400">{stage.name}</span>
          </div>
        ))}
      </div>

      {/* Total value */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-sm text-slate-400">Total Pipeline Value</p>
        <p className="text-2xl font-bold text-white">$0</p>
      </div>
    </div>
  )
}
