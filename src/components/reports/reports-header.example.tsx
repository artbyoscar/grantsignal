'use client'

import { useState } from 'react'
import { ReportsHeader } from './reports-header'
import { ReportsDashboard } from './reports-dashboard'

/**
 * Example usage of the ReportsHeader component
 *
 * This demonstrates how to integrate the header with date range
 * selection into a reports page with the ReportsDashboard component.
 */
export function ReportsPageExample() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 18)),
    end: new Date(),
  })

  const handleDateRangeChange = (newRange: { start: Date; end: Date }) => {
    setDateRange(newRange)
    // Here you would typically fetch new data based on the date range
    console.log('Date range changed:', newRange)
  }

  return (
    <div className="space-y-6">
      <ReportsHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      <ReportsDashboard />
    </div>
  )
}
