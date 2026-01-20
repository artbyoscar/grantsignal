import { currentUser } from '@clerk/nextjs/server'
import { CheckCircle, Clock } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { PipelineSummary } from '@/components/dashboard/pipeline-summary'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user?.firstName || 'there'}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Grants"
          value="0"
          trend={{ value: "No change", direction: "neutral" }}
        />
        <StatCard
          label="Pending Decisions"
          value="0"
          trend={{ value: "No pending", direction: "neutral" }}
        />
        <StatCard
          label="YTD Awarded"
          value="$0"
          trend={{ value: "Start applying!", direction: "neutral" }}
        />
        <StatCard
          label="Win Rate"
          value="0%"
          trend={{ value: "No data yet", direction: "neutral" }}
        />
      </div>

      {/* Pipeline Summary */}
      <PipelineSummary />

      {/* Urgent Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Urgent Actions</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="text-slate-300 font-medium">All caught up!</p>
            <p className="text-sm text-slate-500 mt-1">No urgent actions needed</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-slate-300 font-medium">No recent activity</p>
            <p className="text-sm text-slate-500 mt-1">Activity will appear here as you work</p>
          </div>
        </div>
      </div>
    </div>
  )
}
