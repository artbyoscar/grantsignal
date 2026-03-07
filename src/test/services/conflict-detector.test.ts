import { describe, it, expect } from 'vitest'

/**
 * Conflict Detection Logic Tests
 * Tests the algorithmic logic of conflict detection without database dependencies
 */

// Test the metric mismatch detection logic
describe('Conflict Detection - Metric Mismatch', () => {
  interface MockCommitment {
    id: string
    grantId: string
    metricName: string | null
    metricValue: string | null
    type: string
    description: string
    dueDate: Date | null
    grant: { funder?: { name: string } }
  }

  function detectMetricMismatches(commitments: MockCommitment[]) {
    const metricGroups = new Map<string, MockCommitment[]>()

    for (const c of commitments) {
      if (c.metricName && c.metricValue) {
        const key = c.metricName.toLowerCase().trim()
        if (!metricGroups.has(key)) metricGroups.set(key, [])
        metricGroups.get(key)!.push(c)
      }
    }

    const conflicts: Array<{
      type: string
      description: string
      severity: string
      commitmentIds: string[]
      affectedGrants: string[]
    }> = []

    for (const [metric, group] of metricGroups) {
      if (group.length > 1) {
        const uniqueValues = [...new Set(group.map(c => c.metricValue))]
        if (uniqueValues.length > 1) {
          const numericValues = uniqueValues.map(v => parseFloat(v || '0')).filter(n => !isNaN(n))
          const variance = numericValues.length > 1
            ? (Math.max(...numericValues) - Math.min(...numericValues)) / Math.max(...numericValues)
            : 0

          const severity = variance > 0.25 ? 'CRITICAL' : variance > 0.1 ? 'HIGH' : 'MEDIUM'

          conflicts.push({
            type: 'METRIC_MISMATCH',
            description: `Different values for "${metric}"`,
            severity,
            commitmentIds: group.map(c => c.id),
            affectedGrants: [...new Set(group.map(c => c.grantId))],
          })
        }
      }
    }

    return conflicts
  }

  it('should detect mismatch when same metric has different values', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: 'youth served', metricValue: '500', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: { funder: { name: 'Foundation A' } } },
      { id: '2', grantId: 'g2', metricName: 'Youth Served', metricValue: '750', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: { funder: { name: 'Foundation B' } } },
    ]

    const conflicts = detectMetricMismatches(commitments)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].type).toBe('METRIC_MISMATCH')
    expect(conflicts[0].affectedGrants).toEqual(['g1', 'g2'])
  })

  it('should not flag when same metric has same values', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: 'youth served', metricValue: '500', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
      { id: '2', grantId: 'g2', metricName: 'youth served', metricValue: '500', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
    ]

    const conflicts = detectMetricMismatches(commitments)
    expect(conflicts).toHaveLength(0)
  })

  it('should calculate CRITICAL severity for >25% variance', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: 'meals', metricValue: '100', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
      { id: '2', grantId: 'g2', metricName: 'meals', metricValue: '200', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
    ]

    const conflicts = detectMetricMismatches(commitments)
    expect(conflicts[0].severity).toBe('CRITICAL')
  })

  it('should calculate HIGH severity for 10-25% variance', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: 'hours', metricValue: '100', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
      { id: '2', grantId: 'g2', metricName: 'hours', metricValue: '120', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
    ]

    const conflicts = detectMetricMismatches(commitments)
    // variance = (120-100)/120 = 0.167 -> HIGH
    expect(conflicts[0].severity).toBe('HIGH')
  })

  it('should calculate MEDIUM severity for <10% variance', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: 'visits', metricValue: '1000', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
      { id: '2', grantId: 'g2', metricName: 'visits', metricValue: '1050', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
    ]

    const conflicts = detectMetricMismatches(commitments)
    // variance = (1050-1000)/1050 = 0.0476 -> MEDIUM
    expect(conflicts[0].severity).toBe('MEDIUM')
  })

  it('should be case-insensitive for metric name matching', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: 'Youth Served', metricValue: '500', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
      { id: '2', grantId: 'g2', metricName: 'youth served', metricValue: '600', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
    ]

    const conflicts = detectMetricMismatches(commitments)
    expect(conflicts).toHaveLength(1)
  })

  it('should skip commitments without metric values', () => {
    const commitments: MockCommitment[] = [
      { id: '1', grantId: 'g1', metricName: null, metricValue: null, type: 'DELIVERABLE', description: 'Submit report', dueDate: null, grant: {} },
      { id: '2', grantId: 'g2', metricName: 'youth served', metricValue: '500', type: 'OUTCOME_METRIC', description: '', dueDate: null, grant: {} },
    ]

    const conflicts = detectMetricMismatches(commitments)
    expect(conflicts).toHaveLength(0)
  })
})

describe('Conflict Detection - Capacity Overcommit', () => {
  function detectCapacityOvercommit(staffingCommitments: Array<{ id: string; grantId: string; metricValue: string | null }>) {
    const totalFTEPromised = staffingCommitments.reduce((sum, c) => {
      const match = c.metricValue?.match(/(\d+\.?\d*)/)
      return sum + (match ? parseFloat(match[1]) : 0)
    }, 0)

    if (totalFTEPromised > 10) {
      return {
        type: 'CAPACITY_OVERCOMMIT',
        severity: totalFTEPromised > 20 ? 'CRITICAL' : 'HIGH',
        totalFTE: totalFTEPromised,
      }
    }
    return null
  }

  it('should detect overcommit when FTE exceeds 10', () => {
    const staffing = [
      { id: '1', grantId: 'g1', metricValue: '4 FTE' },
      { id: '2', grantId: 'g2', metricValue: '5 FTE' },
      { id: '3', grantId: 'g3', metricValue: '3 FTE' },
    ]

    const conflict = detectCapacityOvercommit(staffing)
    expect(conflict).not.toBeNull()
    expect(conflict!.totalFTE).toBe(12)
    expect(conflict!.severity).toBe('HIGH')
  })

  it('should not flag when FTE is within capacity', () => {
    const staffing = [
      { id: '1', grantId: 'g1', metricValue: '3 FTE' },
      { id: '2', grantId: 'g2', metricValue: '2 FTE' },
    ]

    const conflict = detectCapacityOvercommit(staffing)
    expect(conflict).toBeNull()
  })

  it('should mark CRITICAL when FTE exceeds 20', () => {
    const staffing = [
      { id: '1', grantId: 'g1', metricValue: '12 FTE' },
      { id: '2', grantId: 'g2', metricValue: '10 FTE' },
    ]

    const conflict = detectCapacityOvercommit(staffing)
    expect(conflict!.severity).toBe('CRITICAL')
  })

  it('should parse decimal FTE values', () => {
    const staffing = [
      { id: '1', grantId: 'g1', metricValue: '5.5 staff' },
      { id: '2', grantId: 'g2', metricValue: '6.0 FTE' },
    ]

    const conflict = detectCapacityOvercommit(staffing)
    expect(conflict).not.toBeNull()
    expect(conflict!.totalFTE).toBe(11.5)
  })
})

describe('Compliance Health Score', () => {
  function calculateHealthScore(overdue: number, conflicts: number, critical: number) {
    return Math.max(0, 100 - (overdue * 10) - (conflicts * 5) - (critical * 15))
  }

  it('should return 100 with no issues', () => {
    expect(calculateHealthScore(0, 0, 0)).toBe(100)
  })

  it('should deduct 10 per overdue commitment', () => {
    expect(calculateHealthScore(3, 0, 0)).toBe(70)
  })

  it('should deduct 5 per conflict', () => {
    expect(calculateHealthScore(0, 4, 0)).toBe(80)
  })

  it('should deduct 15 per critical conflict', () => {
    expect(calculateHealthScore(0, 0, 2)).toBe(70)
  })

  it('should combine all deductions', () => {
    expect(calculateHealthScore(2, 3, 1)).toBe(50)
    // 100 - 20 - 15 - 15 = 50
  })

  it('should floor at 0', () => {
    expect(calculateHealthScore(10, 10, 10)).toBe(0)
  })
})
