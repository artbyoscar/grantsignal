'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { FileText } from 'lucide-react'

interface ProgramData {
  name: string
  value: number
  count: number
}

interface FundingByProgramChartProps {
  data: ProgramData[]
}

const COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#f97316', // orange
]

export function FundingByProgramChart({ data }: FundingByProgramChartProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Funding by Program Area</h2>
        <span className="text-xs text-slate-400">
          {data.reduce((sum, item) => sum + item.count, 0)} grants
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-[140px] flex flex-col items-center justify-center text-slate-400">
          <FileText className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-xs">No program funding data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
          />
          <Legend
            verticalAlign="bottom"
            height={24}
            iconType="circle"
            wrapperStyle={{
              fontSize: '10px',
              color: '#94a3b8',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Funding</span>
          <span className="text-lg font-bold text-white">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
