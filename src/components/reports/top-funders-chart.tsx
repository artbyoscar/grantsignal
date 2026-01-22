'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TopFundersProps {
  funders: { name: string; amount: number }[]
}

// Gradient blue colors for bars
const COLORS = [
  '#3b82f6', // bright blue
  '#2563eb', // medium blue
  '#1d4ed8', // darker blue
  '#1e40af', // even darker
  '#1e3a8a', // darkest blue
]

export function TopFundersChart({ funders }: TopFundersProps) {
  // Sort by amount descending and take top 5
  const topFunders = [...funders]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Top Funders</h2>
        <span className="text-sm text-slate-400">by total funding</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={topFunders}
          layout="vertical"
          margin={{ top: 5, right: 60, left: 100, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={formatCurrency}
            stroke="#334155"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            width={90}
            stroke="#334155"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {topFunders.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Showing top {topFunders.length} funders</span>
          <span>
            Total: {formatCurrency(topFunders.reduce((sum, f) => sum + f.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
