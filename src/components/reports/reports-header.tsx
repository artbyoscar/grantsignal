'use client'

import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReportsHeaderProps {
  dateRange: { start: Date; end: Date }
  onDateRangeChange: (range: { start: Date; end: Date }) => void
}

type DatePreset = {
  label: string
  value: string
  getDates: () => { start: Date; end: Date }
}

const datePresets: DatePreset[] = [
  {
    label: 'Last 30 Days',
    value: 'last_30_days',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return { start, end }
    },
  },
  {
    label: 'Last 90 Days',
    value: 'last_90_days',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 90)
      return { start, end }
    },
  },
  {
    label: 'Last 12 Months',
    value: 'last_12_months',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 12)
      return { start, end }
    },
  },
  {
    label: 'Last 18 Months',
    value: 'last_18_months',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 18)
      return { start, end }
    },
  },
  {
    label: 'Year to Date',
    value: 'year_to_date',
    getDates: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), 0, 1)
      return { start, end }
    },
  },
  {
    label: 'All Time',
    value: 'all_time',
    getDates: () => {
      const end = new Date()
      const start = new Date(2020, 0, 1) // Arbitrary start date
      return { start, end }
    },
  },
]

function formatDateRange(start: Date, end: Date): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    year: 'numeric',
  }

  const startStr = start.toLocaleDateString('en-US', formatOptions)
  const endStr = end.toLocaleDateString('en-US', formatOptions)

  return `${startStr} - ${endStr}`
}

function getCurrentPresetValue(dateRange: { start: Date; end: Date }): string {
  // Find the preset that matches the current date range
  const matchingPreset = datePresets.find(preset => {
    const presetDates = preset.getDates()
    const startMatch =
      Math.abs(presetDates.start.getTime() - dateRange.start.getTime()) < 86400000 // Within 1 day
    const endMatch =
      Math.abs(presetDates.end.getTime() - dateRange.end.getTime()) < 86400000
    return startMatch && endMatch
  })

  return matchingPreset?.value || 'custom'
}

export function ReportsHeader({
  dateRange,
  onDateRangeChange,
}: ReportsHeaderProps) {
  const currentPreset = getCurrentPresetValue(dateRange)

  const handlePresetChange = (value: string) => {
    const preset = datePresets.find(p => p.value === value)
    if (preset) {
      const newRange = preset.getDates()
      onDateRangeChange(newRange)
    }
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-white">Reports &amp; Analytics</h1>

      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-slate-400" />
        <Select value={currentPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[280px]">
            <SelectValue>
              <span className="text-sm">
                {currentPreset === 'custom'
                  ? formatDateRange(dateRange.start, dateRange.end)
                  : datePresets.find(p => p.value === currentPreset)?.label +
                    ': ' +
                    formatDateRange(dateRange.start, dateRange.end)}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {datePresets.map(preset => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
