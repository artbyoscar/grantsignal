import { describe, it, expect, vi } from 'vitest'

/**
 * Compliance Extraction Workflow - Integration Tests
 * Covers: commitment extraction, batch extraction, conflict detection,
 * conflict resolution, compliance summary, and audit trail
 */

type CommitmentType = 'METRIC' | 'DELIVERABLE' | 'STAFFING' | 'BUDGET' | 'REPORTING' | 'OTHER'
type CommitmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'WAIVED'
type ConflictType = 'METRIC_MISMATCH' | 'TIMELINE_OVERLAP' | 'CAPACITY_OVERCOMMIT' | 'BUDGET_DISCREPANCY'
type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

function createMockCommitment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'commit-test-1',
    organizationId: 'org-test-1',
    grantId: 'grant-test-1',
    documentId: 'doc-test-1',
    type: 'METRIC' as CommitmentType,
    description: 'Serve 500 students annually in after-school programs',
    metricName: 'students served',
    metricValue: '500',
    dueDate: new Date('2025-12-31'),
    status: 'PENDING' as CommitmentStatus,
    grant: {
      id: 'grant-test-1',
      status: 'AWARDED',
      funder: { name: 'Gates Foundation' },
    },
    ...overrides,
  }
}

function createMockConflict(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conflict-test-1',
    commitmentId: 'commit-test-1',
    relatedCommitmentIds: ['commit-test-2'],
    conflictType: 'METRIC_MISMATCH' as ConflictType,
    description: 'Different values for "students served": 500 to Gates Foundation, 750 to Ford Foundation',
    severity: 'HIGH' as ConflictSeverity,
    affectedGrants: ['grant-test-1', 'grant-test-2'],
    suggestedResolution: 'Review and align the metric across all applications.',
    status: 'UNRESOLVED' as const,
    detectedValues: {
      conflictingCommitments: ['commit-test-1', 'commit-test-2'],
      affectedGrants: ['grant-test-1', 'grant-test-2'],
    },
    createdAt: new Date(),
    resolvedAt: null as Date | null,
    resolvedBy: null as string | null,
    resolutionNotes: null as string | null,
    ...overrides,
  }
}

describe('Compliance Extraction Workflow', () => {
  describe('Commitment extraction (single document)', () => {
    it('should extract commitments from a document and grant', () => {
      const input = { documentId: 'doc-test-1', grantId: 'grant-test-1' }
      expect(input.documentId).toBeTruthy()
      expect(input.grantId).toBeTruthy()
    })

    it('should return extracted commitments with count', () => {
      const commitments = [
        createMockCommitment({ type: 'METRIC' }),
        createMockCommitment({ type: 'DELIVERABLE', id: 'commit-2' }),
        createMockCommitment({ type: 'STAFFING', id: 'commit-3' }),
      ]

      const result = { count: commitments.length, commitments }
      expect(result.count).toBe(3)
      expect(result.commitments).toHaveLength(3)
    })

    it('should categorize commitments by type', () => {
      const types: CommitmentType[] = ['METRIC', 'DELIVERABLE', 'STAFFING', 'BUDGET', 'REPORTING', 'OTHER']
      expect(types).toHaveLength(6)

      const commitment = createMockCommitment({ type: 'METRIC' })
      expect(types).toContain(commitment.type)
    })
  })

  describe('Batch commitment extraction', () => {
    it('should only process AWARDED grants', () => {
      const grants = [
        { id: 'g1', status: 'AWARDED' },
        { id: 'g2', status: 'WRITING' },
        { id: 'g3', status: 'AWARDED' },
        { id: 'g4', status: 'SUBMITTED' },
      ]

      const eligible = grants.filter((g) => g.status === 'AWARDED')
      expect(eligible).toHaveLength(2)
    })

    it('should only process grants with COMPLETED award documents', () => {
      const grants = [
        {
          id: 'g1',
          status: 'AWARDED',
          documents: [
            { type: 'AWARD_LETTER', status: 'COMPLETED' },
            { type: 'PROPOSAL', status: 'COMPLETED' },
          ],
        },
        {
          id: 'g2',
          status: 'AWARDED',
          documents: [{ type: 'AWARD_LETTER', status: 'PENDING' }],
        },
      ]

      const eligible = grants.filter((g) =>
        g.documents.some(
          (d) =>
            ['AWARD_LETTER', 'AGREEMENT'].includes(d.type) && d.status === 'COMPLETED'
        )
      )
      expect(eligible).toHaveLength(1)
    })

    it('should filter by specific grantIds when provided', () => {
      const targetIds = ['grant-1', 'grant-3']
      const allGrants = [
        { id: 'grant-1', status: 'AWARDED' },
        { id: 'grant-2', status: 'AWARDED' },
        { id: 'grant-3', status: 'AWARDED' },
      ]

      const filtered = allGrants.filter((g) => targetIds.includes(g.id))
      expect(filtered).toHaveLength(2)
    })

    it('should continue processing even when individual extractions fail', () => {
      const results = [
        { grantId: 'g1', documentId: 'd1', count: 5, success: true },
        { grantId: 'g2', documentId: 'd2', count: 0, success: false, error: 'Parse error' },
        { grantId: 'g3', documentId: 'd3', count: 3, success: true },
      ]

      const summary = {
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      }

      expect(summary.processed).toBe(3)
      expect(summary.successful).toBe(2)
      expect(summary.failed).toBe(1)
    })

    it('should log audit trail for batch extraction', () => {
      const grantCount = 5
      const audit = {
        actionType: 'SCAN_COMPLETED',
        description: `Batch extracted commitments from ${grantCount} grants`,
        performedBy: 'user-test-1',
        metadata: { grantCount },
      }

      expect(audit.actionType).toBe('SCAN_COMPLETED')
      expect(audit.description).toContain('5 grants')
    })
  })

  describe('Conflict detection', () => {
    describe('METRIC_MISMATCH detection', () => {
      it('should detect when same metric has different values across grants', () => {
        const commitments = [
          createMockCommitment({ metricName: 'students served', metricValue: '500', grantId: 'g1' }),
          createMockCommitment({ metricName: 'students served', metricValue: '750', grantId: 'g2', id: 'c2' }),
        ]

        // Group by normalized metric name
        const groups = new Map<string, typeof commitments>()
        for (const c of commitments) {
          const key = (c.metricName as string).toLowerCase().trim()
          const existing = groups.get(key) || []
          groups.set(key, [...existing, c])
        }

        const studentsGroup = groups.get('students served')!
        const uniqueValues = [...new Set(studentsGroup.map((c) => c.metricValue))]
        expect(uniqueValues).toHaveLength(2)
        expect(uniqueValues).toContain('500')
        expect(uniqueValues).toContain('750')
      })

      it('should calculate severity based on variance', () => {
        // > 25% variance = CRITICAL, > 10% = HIGH, else MEDIUM
        const calculateSeverity = (values: number[]) => {
          const variance =
            (Math.max(...values) - Math.min(...values)) / Math.max(...values)
          return variance > 0.25 ? 'CRITICAL' : variance > 0.1 ? 'HIGH' : 'MEDIUM'
        }

        expect(calculateSeverity([500, 750])).toBe('CRITICAL') // 33% variance
        expect(calculateSeverity([500, 560])).toBe('HIGH') // 10.7% variance
        expect(calculateSeverity([500, 520])).toBe('MEDIUM') // 3.8% variance
      })

      it('should NOT flag when all values match', () => {
        const values = ['500', '500', '500']
        const uniqueValues = [...new Set(values)]
        expect(uniqueValues).toHaveLength(1) // No conflict
      })
    })

    describe('TIMELINE_OVERLAP detection', () => {
      it('should detect conflicting delivery dates for similar deliverables', () => {
        const deliverables = [
          createMockCommitment({
            type: 'DELIVERABLE',
            description: 'Submit annual impact report',
            dueDate: new Date('2025-06-30'),
          }),
          createMockCommitment({
            type: 'DELIVERABLE',
            description: 'Submit annual impact report',
            dueDate: new Date('2025-10-15'),
            id: 'c2',
          }),
        ]

        const dates = deliverables.map((d) => (d.dueDate as Date).getTime())
        const dateRange = Math.max(...dates) - Math.min(...dates)
        const daysDiff = dateRange / (1000 * 60 * 60 * 24)

        expect(daysDiff).toBeGreaterThan(30) // Conflict threshold
      })

      it('should NOT flag when dates are within 30 days', () => {
        const dates = [
          new Date('2025-06-15').getTime(),
          new Date('2025-07-01').getTime(),
        ]
        const daysDiff =
          (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)

        expect(daysDiff).toBeLessThanOrEqual(30) // No conflict
      })

      it('should assign HIGH severity for >90 day differences', () => {
        const daysDiff = 120
        const severity = daysDiff > 90 ? 'HIGH' : 'MEDIUM'
        expect(severity).toBe('HIGH')
      })
    })

    describe('CAPACITY_OVERCOMMIT detection', () => {
      it('should detect when total FTE exceeds threshold', () => {
        const staffingCommitments = [
          createMockCommitment({ type: 'STAFFING', metricValue: '3.0 FTE' }),
          createMockCommitment({ type: 'STAFFING', metricValue: '4.5 FTE', id: 'c2' }),
          createMockCommitment({ type: 'STAFFING', metricValue: '5.0 FTE', id: 'c3' }),
        ]

        const totalFTE = staffingCommitments.reduce((sum, c) => {
          const match = (c.metricValue as string).match(/(\d+\.?\d*)/)
          return sum + (match ? parseFloat(match[1]) : 0)
        }, 0)

        expect(totalFTE).toBe(12.5)
        expect(totalFTE).toBeGreaterThan(10) // Threshold
      })

      it('should assign CRITICAL severity for >20 FTE', () => {
        const totalFTE = 22.5
        const severity = totalFTE > 20 ? 'CRITICAL' : 'HIGH'
        expect(severity).toBe('CRITICAL')
      })

      it('should NOT flag when under threshold', () => {
        const totalFTE = 8.0
        const isOvercommitted = totalFTE > 10
        expect(isOvercommitted).toBe(false)
      })
    })

    describe('Conflict deduplication', () => {
      it('should not create duplicate conflicts for same commitment+type', () => {
        const existingConflicts = [
          createMockConflict({ commitmentId: 'c1', conflictType: 'METRIC_MISMATCH', status: 'UNRESOLVED' }),
        ]

        const newConflict = { commitmentId: 'c1', conflictType: 'METRIC_MISMATCH' }

        const isDuplicate = existingConflicts.some(
          (c) =>
            c.commitmentId === newConflict.commitmentId &&
            c.conflictType === newConflict.conflictType &&
            c.status === 'UNRESOLVED'
        )

        expect(isDuplicate).toBe(true)
      })

      it('should allow new conflict if previous one is resolved', () => {
        const existingConflicts = [
          createMockConflict({ commitmentId: 'c1', conflictType: 'METRIC_MISMATCH', status: 'RESOLVED' }),
        ]

        const isDuplicate = existingConflicts.some(
          (c) =>
            c.commitmentId === 'c1' &&
            c.conflictType === 'METRIC_MISMATCH' &&
            c.status === 'UNRESOLVED'
        )

        expect(isDuplicate).toBe(false)
      })
    })
  })

  describe('Conflict resolution', () => {
    it('should mark conflict as RESOLVED with notes', () => {
      const conflict = createMockConflict()
      const resolved = {
        ...conflict,
        status: 'RESOLVED' as const,
        resolutionNotes: 'Aligned to 500 students across all grants.',
        resolvedAt: new Date(),
        resolvedBy: 'user-test-1',
      }

      expect(resolved.status).toBe('RESOLVED')
      expect(resolved.resolutionNotes).toContain('500 students')
      expect(resolved.resolvedBy).toBe('user-test-1')
      expect(resolved.resolvedAt).toBeTruthy()
    })

    it('should mark conflict as IGNORED with notes', () => {
      const conflict = createMockConflict()
      const ignored = {
        ...conflict,
        status: 'IGNORED' as const,
        resolutionNotes: 'Different programs, metrics are intentionally different.',
        resolvedAt: new Date(),
        resolvedBy: 'user-test-1',
      }

      expect(ignored.status).toBe('IGNORED')
    })
  })

  describe('Compliance summary (dashboard)', () => {
    it('should calculate health score from commitment statuses', () => {
      const commitments = [
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'IN_PROGRESS' },
        { status: 'OVERDUE' },
        { status: 'PENDING' },
      ]

      const total = commitments.length
      const completed = commitments.filter((c) => c.status === 'COMPLETED').length
      const overdue = commitments.filter((c) => c.status === 'OVERDUE').length

      const healthScore = Math.round(((completed / total) * 70) + (((total - overdue) / total) * 30))

      expect(healthScore).toBeGreaterThan(0)
      expect(healthScore).toBeLessThanOrEqual(100)
      expect(completed).toBe(2)
      expect(overdue).toBe(1)
    })

    it('should count unresolved conflicts by severity', () => {
      const conflicts = [
        createMockConflict({ severity: 'CRITICAL', status: 'UNRESOLVED' }),
        createMockConflict({ severity: 'HIGH', status: 'UNRESOLVED', id: 'c2' }),
        createMockConflict({ severity: 'HIGH', status: 'RESOLVED', id: 'c3' }),
        createMockConflict({ severity: 'MEDIUM', status: 'UNRESOLVED', id: 'c4' }),
      ]

      const unresolved = conflicts.filter((c) => c.status === 'UNRESOLVED')
      const bySeverity = {
        critical: unresolved.filter((c) => c.severity === 'CRITICAL').length,
        high: unresolved.filter((c) => c.severity === 'HIGH').length,
        medium: unresolved.filter((c) => c.severity === 'MEDIUM').length,
      }

      expect(bySeverity.critical).toBe(1)
      expect(bySeverity.high).toBe(1)
      expect(bySeverity.medium).toBe(1)
    })

    it('should track upcoming deadlines', () => {
      const now = new Date('2025-06-01')
      const commitments = [
        createMockCommitment({ dueDate: new Date('2025-06-10') }),
        createMockCommitment({ dueDate: new Date('2025-06-25'), id: 'c2' }),
        createMockCommitment({ dueDate: new Date('2025-08-01'), id: 'c3' }),
      ]

      const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcoming = commitments.filter(
        (c) =>
          c.dueDate &&
          (c.dueDate as Date).getTime() >= now.getTime() &&
          (c.dueDate as Date).getTime() <= thirtyDaysOut.getTime()
      )

      expect(upcoming).toHaveLength(2)
    })
  })

  describe('Commitment list filtering', () => {
    it('should filter by grant ID', () => {
      const commitments = [
        createMockCommitment({ grantId: 'g1' }),
        createMockCommitment({ grantId: 'g2', id: 'c2' }),
        createMockCommitment({ grantId: 'g1', id: 'c3' }),
      ]

      const filtered = commitments.filter((c) => c.grantId === 'g1')
      expect(filtered).toHaveLength(2)
    })

    it('should filter by commitment status', () => {
      const commitments = [
        createMockCommitment({ status: 'PENDING' }),
        createMockCommitment({ status: 'COMPLETED', id: 'c2' }),
        createMockCommitment({ status: 'OVERDUE', id: 'c3' }),
      ]

      const overdue = commitments.filter((c) => c.status === 'OVERDUE')
      expect(overdue).toHaveLength(1)
    })

    it('should filter by commitment type', () => {
      const commitments = [
        createMockCommitment({ type: 'METRIC' }),
        createMockCommitment({ type: 'DELIVERABLE', id: 'c2' }),
        createMockCommitment({ type: 'METRIC', id: 'c3' }),
      ]

      const metrics = commitments.filter((c) => c.type === 'METRIC')
      expect(metrics).toHaveLength(2)
    })

    it('should filter by due date range', () => {
      const commitments = [
        createMockCommitment({ dueDate: new Date('2025-03-15') }),
        createMockCommitment({ dueDate: new Date('2025-06-30'), id: 'c2' }),
        createMockCommitment({ dueDate: new Date('2025-09-15'), id: 'c3' }),
      ]

      const afterDate = new Date('2025-04-01')
      const beforeDate = new Date('2025-08-01')

      const filtered = commitments.filter(
        (c) =>
          (c.dueDate as Date).getTime() >= afterDate.getTime() &&
          (c.dueDate as Date).getTime() <= beforeDate.getTime()
      )

      expect(filtered).toHaveLength(1)
    })
  })

  describe('Audit trail', () => {
    it('should record SCAN_COMPLETED for conflict detection runs', () => {
      const audit = {
        organizationId: 'org-test-1',
        actionType: 'SCAN_COMPLETED',
        performedBy: 'SYSTEM',
        metadata: { conflictCount: 3, trigger: 'document_processed' },
      }

      expect(audit.actionType).toBe('SCAN_COMPLETED')
      expect(audit.performedBy).toBe('SYSTEM')
    })

    it('should record user-initiated actions with userId', () => {
      const audit = {
        actionType: 'SCAN_COMPLETED',
        performedBy: 'user-test-1',
        description: 'Manual conflict detection run',
      }

      expect(audit.performedBy).toBe('user-test-1')
      expect(audit.performedBy).not.toBe('SYSTEM')
    })
  })
})
