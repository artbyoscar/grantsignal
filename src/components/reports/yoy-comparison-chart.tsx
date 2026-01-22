'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar } from 'lucide-react'

interface YoYData {
  category: string
  currentYear: number
  previousYear: number
}

interface YoYComparisonChartProps {
  data: YoYData[]
  currentYearLabel?: string
  previousYearLabel?: string
}

export function YoYComparisonChart({
  data,
  currentYearLabel = '2024',
  previousYearLabel = '2023'
}: YoYComparisonChartProps) {
  const currentTotal = data.reduce((sum, item) => sum + item.currentYear, 0)
  const previousTotal = data.reduce((sum, item) => sum + item.previousYear, 0)
  const percentChange = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
    : '0'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Year-over-Year Comparison</h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            Number(percentChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {Number(percentChange) >= 0 ? '+' : ''}{percentChange}%
          </span>
          <span className="text-sm text-slate-400">vs last year</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
          <Calendar className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">No year-over-year data available</p>
          <p className="text-xs text-slate-500 mt-1">Data will appear once grants are awarded</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="category"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
          />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              color: '#94a3b8',
            }}
          />
          <Bar
            dataKey="previousYear"
            name={previousYearLabel}
            fill="#64748b"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="currentYear"
            name={currentYearLabel}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-slate-400">{previousYearLabel} Total</span>
          <p className="text-xl font-bold text-slate-300">
            ${previousTotal.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-sm text-slate-400">{currentYearLabel} Total</span>
          <p className="text-xl font-bold text-white">
            ${currentTotal.toLocaleString()}
          </p>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
