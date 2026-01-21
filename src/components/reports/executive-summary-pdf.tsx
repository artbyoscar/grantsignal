'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

// Define types for the data
interface KeyMetrics {
  totalSubmitted: number
  totalAwarded: number
  winRate: number
  totalRequested: number
  totalAwarded: number
}

interface PipelineItem {
  status: string
  count: number
  totalValue: number
}

interface RecentWin {
  id: string
  funderName: string
  amount: number
  awardedAt: Date | null
  programName: string | null
}

interface UpcomingDeadline {
  id: string
  funderName: string
  deadline: Date | null
  amountRequested: number
  status: string
}

interface ProgramPerformance {
  programId: string
  programName: string
  submitted: number
  awarded: number
  successRate: number
}

interface ExecutiveSummaryData {
  organizationName: string
  dateRange: {
    startDate: Date
    endDate: Date
  }
  keyMetrics: KeyMetrics
  pipelineOverview: PipelineItem[]
  recentWins: RecentWin[]
  upcomingDeadlines: UpcomingDeadline[]
  programPerformance: ProgramPerformance[]
}

interface ExecutiveSummaryPDFProps {
  data: ExecutiveSummaryData
}

const STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  RESEARCHING: 'Researching',
  WRITING: 'Writing',
  REVIEW: 'Review',
  SUBMITTED: 'Submitted',
  PENDING: 'Pending',
  AWARDED: 'Awarded',
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0f172a',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '18%',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  card: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardItemText: {
    fontSize: 8,
    color: '#0f172a',
  },
  cardItemValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
})

// PDF Document Component
const ExecutiveSummaryDocument = ({ data }: ExecutiveSummaryPDFProps) => {
  const formatCurrency = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Executive Summary Report</Text>
          <Text style={styles.subtitle}>{data.organizationName}</Text>
          <Text style={styles.dateRange}>
            Report Period: {formatDate(data.dateRange.startDate)} - {formatDate(data.dateRange.endDate)}
          </Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Submitted</Text>
              <Text style={styles.metricValue}>{data.keyMetrics.totalSubmitted}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Awarded</Text>
              <Text style={styles.metricValue}>{data.keyMetrics.totalAwarded}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Win Rate</Text>
              <Text style={styles.metricValue}>{data.keyMetrics.winRate}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Requested</Text>
              <Text style={styles.metricValue}>{formatCurrency(data.keyMetrics.totalRequested)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Awarded</Text>
              <Text style={styles.metricValue}>{formatCurrency(data.keyMetrics.totalAwarded)}</Text>
            </View>
          </View>
        </View>

        {/* Pipeline Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pipeline Overview</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { width: '40%' }]}>Stage</Text>
              <Text style={[styles.tableCellHeader, { width: '30%', textAlign: 'right' }]}>Count</Text>
              <Text style={[styles.tableCellHeader, { width: '30%', textAlign: 'right' }]}>Total Value</Text>
            </View>
            {data.pipelineOverview.filter(p => p.count > 0).map((pipeline, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{STATUS_LABELS[pipeline.status]}</Text>
                <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>{pipeline.count}</Text>
                <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>
                  {formatCurrency(pipeline.totalValue)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Wins and Upcoming Deadlines */}
        <View style={styles.twoColumnGrid}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Recent Wins</Text>
            <View style={styles.card}>
              {data.recentWins.length > 0 ? (
                data.recentWins.map((win, idx) => (
                  <View key={idx} style={styles.cardItem}>
                    <View>
                      <Text style={styles.cardItemText}>{win.funderName}</Text>
                      <Text style={[styles.cardItemText, { fontSize: 7, color: '#64748b' }]}>
                        {formatDate(new Date(win.awardedAt || ''))}
                      </Text>
                    </View>
                    <Text style={styles.cardItemValue}>{formatCurrency(win.amount)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.cardItemText}>No awards in this period</Text>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            <View style={[styles.card, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
              {data.upcomingDeadlines.length > 0 ? (
                data.upcomingDeadlines.slice(0, 5).map((deadline, idx) => (
                  <View key={idx} style={styles.cardItem}>
                    <View>
                      <Text style={styles.cardItemText}>{deadline.funderName}</Text>
                      <Text style={[styles.cardItemText, { fontSize: 7, color: '#64748b' }]}>
                        {formatDate(new Date(deadline.deadline || ''))}
                      </Text>
                    </View>
                    <Text style={[styles.cardItemValue, { color: '#d97706' }]}>
                      {formatCurrency(deadline.amountRequested)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.cardItemText}>No upcoming deadlines</Text>
              )}
            </View>
          </View>
        </View>

        {/* Program Performance */}
        {data.programPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Program Performance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { width: '40%' }]}>Program</Text>
                <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Submitted</Text>
                <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Awarded</Text>
                <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Success Rate</Text>
              </View>
              {data.programPerformance.map((program, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>{program.programName}</Text>
                  <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{program.submitted}</Text>
                  <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{program.awarded}</Text>
                  <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                    {program.successRate.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by GrantSignal • {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  )
}

// Export Button Component
export function ExecutiveSummaryPDFExport({ data }: ExecutiveSummaryPDFProps) {
  return (
    <PDFDownloadLink
      document={<ExecutiveSummaryDocument data={data} />}
      fileName={`executive-summary-${new Date().toISOString().split('T')[0]}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <Button
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
