import { type Grant } from '@/types/client-types'

/**
 * Convert grants data to CSV format
 */
export function exportGrantsToCSV(grants: Grant[]): string {
  // Define CSV headers
  const headers = [
    'Funder Name',
    'Funder Type',
    'Grant Title/Notes',
    'Program',
    'Amount Requested',
    'Amount Awarded',
    'Deadline',
    'Status',
    'Submitted Date',
    'Award Date',
    'Start Date',
    'End Date',
  ]

  // Convert grants to CSV rows
  const rows = grants.map((grant) => {
    return [
      grant.funder?.name || 'N/A',
      grant.funder?.type || 'N/A',
      grant.notes || 'N/A',
      grant.program?.name || 'N/A',
      grant.amountRequested?.toString() || 'N/A',
      grant.amountAwarded?.toString() || 'N/A',
      grant.deadline ? new Date(grant.deadline).toLocaleDateString() : 'N/A',
      grant.status,
      grant.submittedAt ? new Date(grant.submittedAt).toLocaleDateString() : 'N/A',
      grant.awardedAt ? new Date(grant.awardedAt).toLocaleDateString() : 'N/A',
      grant.startDate ? new Date(grant.startDate).toLocaleDateString() : 'N/A',
      grant.endDate ? new Date(grant.endDate).toLocaleDateString() : 'N/A',
    ]
  })

  // Escape CSV values
  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Build CSV content
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Trigger download of CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  // Create a Blob with the CSV content
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })

  // Create a download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}

/**
 * Export grants to CSV and trigger download
 */
export function exportAndDownloadGrants(grants: Grant[]): void {
  const csv = exportGrantsToCSV(grants)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `grants-export-${timestamp}.csv`
  downloadCSV(csv, filename)
}
