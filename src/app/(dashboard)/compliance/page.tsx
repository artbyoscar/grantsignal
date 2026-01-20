import { Shield, AlertTriangle, CheckCircle, Clock, FileWarning, Search } from 'lucide-react'

const commitmentStats = [
  { label: 'Total Commitments', value: '0', icon: FileWarning, color: 'text-slate-400' },
  { label: 'On Track', value: '0', icon: CheckCircle, color: 'text-emerald-500' },
  { label: 'At Risk', value: '0', icon: AlertTriangle, color: 'text-amber-500' },
  { label: 'Overdue', value: '0', icon: Clock, color: 'text-red-500' },
]

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Compliance Guardian</h1>
        <p className="text-slate-400 mt-1">Track commitments and detect conflicts across all grants.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {commitmentStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{stat.label}</p>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Conflict Detection */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Conflict Detection</h2>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
            Run Scan
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No conflicts detected</h3>
          <p className="text-slate-400 text-sm max-w-md">
            When you have active grants, we will automatically scan for conflicting commitments,
            mismatched metrics, and timeline overlaps.
          </p>
        </div>
      </div>

      {/* Commitment Registry */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Commitment Registry</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search commitments..."
                className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 border-b border-slate-700 text-sm text-slate-400">
          <div>Commitment</div>
          <div>Grant</div>
          <div>Funder</div>
          <div>Due Date</div>
          <div>Status</div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileWarning className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No commitments tracked</h3>
          <p className="text-slate-400 text-sm max-w-md">
            Commitments will be automatically extracted from your grant proposals and award letters.
          </p>
        </div>
      </div>
    </div>
  )
}
