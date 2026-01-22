'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Funding by Program Area</h2>
        <span className="text-sm text-slate-400">
          {data.reduce((sum, item) => sum + item.count, 0)} grants
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
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
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontSize: '12px',
              color: '#94a3b8',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Total Funding</span>
          <span className="text-2xl font-bold text-white">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
