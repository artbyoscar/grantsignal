'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar } from 'lucide-react'

interface YoYData {
  category: string
  currentYear: number
  previousYear: number
  currentYearCount?: number
  previousYearCount?: number
  currentYearWinRate?: number
  previousYearWinRate?: number
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Year-over-Year</h2>
        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium ${
            Number(percentChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {Number(percentChange) >= 0 ? '+' : ''}{percentChange}%
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[140px] flex flex-col items-center justify-center text-slate-400">
          <Calendar className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-xs">No YoY data available</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="category"
            stroke="#94a3b8"
            style={{ fontSize: '10px' }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '10px' }}
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
              fontSize: '10px',
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

          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <span className="text-xs text-slate-400">{previousYearLabel} Total</span>
                <p className="text-sm font-bold text-slate-300">
                  ${previousTotal.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">{currentYearLabel} Total</span>
                <p className="text-sm font-bold text-white">
                  ${currentTotal.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Grants Awarded:</span>
                <span className="text-slate-300">
                  {data.reduce((sum, item) => sum + (item.previousYearCount || 0), 0)} → {data.reduce((sum, item) => sum + (item.currentYearCount || 0), 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Avg Win Rate:</span>
                <span className="text-slate-300">
                  {Math.round(data.reduce((sum, item) => sum + (item.previousYearWinRate || 0), 0) / data.filter(d => d.previousYearWinRate).length || 0)}% → {Math.round(data.reduce((sum, item) => sum + (item.currentYearWinRate || 0), 0) / data.filter(d => d.currentYearWinRate).length || 0)}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
