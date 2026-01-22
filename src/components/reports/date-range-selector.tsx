'use client'

import { Calendar } from 'lucide-react'
import { useState } from 'react'

interface DateRangeSelectorProps {
  value: { startDate: string; endDate: string }
  onChange: (range: { startDate: string; endDate: string }) => void
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isCustom, setIsCustom] = useState(false)

  const presets = [
    { label: 'Last 30 Days', getValue: () => ({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })},
    { label: 'Last 90 Days', getValue: () => ({
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })},
    { label: 'Year to Date', getValue: () => ({
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })},
    { label: 'Last Year', getValue: () => ({
      startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0],
    })},
  ]

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-400" />

      {!isCustom ? (
        <div className="flex items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange(preset.getValue())}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setIsCustom(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Custom
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsCustom(false)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Presets
          </button>
        </div>
      )}
    </div>
  )
}
