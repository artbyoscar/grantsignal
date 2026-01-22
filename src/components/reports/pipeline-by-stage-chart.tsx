'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface StageData {
  stage: string
  value: number
  count: number
}

interface PipelineByStageChartProps {
  data: StageData[]
}

export function PipelineByStageChart({ data }: PipelineByStageChartProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Pipeline Value by Stage</h2>
        <span className="text-sm text-slate-400">
          {data.reduce((sum, item) => sum + item.count, 0)} grants
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="stage"
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
            formatter={(value, name, props: any) => [
              `$${Number(value).toLocaleString()}`,
              `${props.payload.count} grants`,
            ]}
          />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Total Pipeline Value</span>
          <span className="text-2xl font-bold text-white">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
