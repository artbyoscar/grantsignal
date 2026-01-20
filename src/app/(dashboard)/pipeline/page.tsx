import { Plus, MoreHorizontal } from 'lucide-react'

const stages = [
  { id: 'prospect', name: 'Prospect', color: 'bg-slate-500' },
  { id: 'researching', name: 'Researching', color: 'bg-purple-500' },
  { id: 'writing', name: 'Writing', color: 'bg-blue-500' },
  { id: 'submitted', name: 'Submitted', color: 'bg-cyan-500' },
  { id: 'pending', name: 'Pending', color: 'bg-orange-500' },
  { id: 'awarded', name: 'Awarded', color: 'bg-emerald-500' },
]

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline</h1>
          <p className="text-slate-400 mt-1">Manage your grant applications.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Grant
        </button>
      </div>

      {/* Pipeline Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Total Grants:</span>
          <span className="text-white font-medium">0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Pipeline Value:</span>
          <span className="text-white font-medium">$0</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-medium text-white">{stage.name}</h3>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">0</span>
              </div>
              <button className="p-1 hover:bg-slate-700 rounded transition-colors">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Column Content */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 min-h-[400px]">
              {/* Empty State */}
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-slate-500">No grants</p>
                <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  + Add grant
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
