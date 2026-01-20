import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-sm",
          trend.direction === 'up' && "text-emerald-500",
          trend.direction === 'down' && "text-red-500",
          trend.direction === 'neutral' && "text-slate-400"
        )}>
          {trend.direction === 'up' && <ArrowUp className="w-4 h-4" />}
          {trend.direction === 'down' && <ArrowDown className="w-4 h-4" />}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  )
}
