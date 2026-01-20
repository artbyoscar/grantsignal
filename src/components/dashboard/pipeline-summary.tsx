import { cn } from "@/lib/utils"

type Grant = {
  id: string
  status: string
  amountRequested: any // Decimal or number or null
  [key: string]: any
}

type PipelineSummaryProps = {
  grants: Grant[]
  isLoading?: boolean
}

const stageConfig = [
  { status: 'PROSPECT', name: 'Prospect', color: 'bg-slate-500' },
  { status: 'RESEARCHING', name: 'Researching', color: 'bg-purple-500' },
  { status: 'WRITING', name: 'Writing', color: 'bg-blue-500' },
  { status: 'REVIEW', name: 'Review', color: 'bg-indigo-500' },
  { status: 'SUBMITTED', name: 'Submitted', color: 'bg-cyan-500' },
  { status: 'PENDING', name: 'Pending', color: 'bg-orange-500' },
  { status: 'AWARDED', name: 'Awarded', color: 'bg-emerald-500' },
  { status: 'ACTIVE', name: 'Active', color: 'bg-emerald-600' },
]

export function PipelineSummary({ grants, isLoading }: PipelineSummaryProps) {
  // Group grants by status and count them
  const stages = stageConfig.map(config => {
    const count = grants.filter(g => g.status === config.status).length
    return { ...config, count }
  })

  const totalGrants = grants.length

  // Calculate total pipeline value from all grants (not just active pipeline)
  const totalValue = grants.reduce((sum, grant) => {
    return sum + Number(grant.amountRequested || 0)
  }, 0)

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Pipeline Summary</h2>
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full animate-pulse" />
        <div className="flex flex-wrap gap-4 mt-4">
          {stageConfig.map((stage) => (
            <div key={stage.name} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", stage.color)} />
              <span className="text-xs text-slate-400">{stage.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">Total Pipeline Value</p>
          <div className="h-8 w-32 bg-slate-700 rounded animate-pulse mt-1" />
        </div>
      </div>
    )
  }

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
            <span className="text-xs text-slate-400">
              {stage.name} {stage.count > 0 && `(${stage.count})`}
            </span>
          </div>
        ))}
      </div>

      {/* Total value */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-sm text-slate-400">Total Pipeline Value</p>
        <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
      </div>
    </div>
  )
}
