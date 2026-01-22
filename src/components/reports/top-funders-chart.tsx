'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FunderData {
  name: string
  value: number
  count: number
}

interface TopFundersChartProps {
  data: FunderData[]
}

export function TopFundersChart({ data }: TopFundersChartProps) {
  // Sort by value and take top 10
  const topFunders = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Top Funders</h2>
        <span className="text-sm text-slate-400">Top 10 by funding</span>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topFunders} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value, name, props: any) => [
              `$${Number(value).toLocaleString()}`,
              `${props.payload.count} grants`,
            ]}
          />
          <Bar
            dataKey="value"
            fill="#10b981"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
