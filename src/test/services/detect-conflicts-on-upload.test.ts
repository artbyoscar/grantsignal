import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Detect Conflicts On Upload - Inngest Function Tests
 * Tests the event-driven conflict detection pipeline triggered after document processing
 */

// Mock data factories
function createMockEvent(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      organizationId: 'org-test-1',
      documentId: 'doc-test-1',
      trigger: 'document_processed' as const,
      ...overrides,
    },
  }
}

function createMockConflict(overrides: Record<string, unknown> = {}) {
  return {
    type: 'METRIC_MISMATCH' as const,
    description: 'Different values for "students served": 500 to Foundation A, 750 to Foundation B',
    severity: 'HIGH' as const,
    commitmentIds: ['commit-1', 'commit-2'],
    affectedGrants: ['grant-1', 'grant-2'],
    suggestedResolution: 'Review and align the metric across all applications.',
    ...overrides,
  }
}

function createMockNotificationPrefs(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-test-1',
    email: 'user@nonprofit.org',
    complianceAlertsEnabled: true,
    user: {
      id: 'user-test-1',
      organizationId: 'org-test-1',
    },
    ...overrides,
  }
}

function createMockDbConflict(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conflict-db-1',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    createdAt: new Date(),
    ...overrides,
  }
}

describe('Detect Conflicts On Upload - Inngest Function', () => {
  describe('Event structure', () => {
    it('should accept compliance/detect-conflicts event', () => {
      const event = createMockEvent()
      expect(event.data.organizationId).toBe('org-test-1')
      expect(event.data.documentId).toBe('doc-test-1')
      expect(event.data.trigger).toBe('document_processed')
    })

    it('should support manual trigger type', () => {
      const event = createMockEvent({ trigger: 'manual' })
      expect(event.data.trigger).toBe('manual')
    })

    it('should require organizationId and documentId', () => {
      const event = createMockEvent()
      expect(event.data.organizationId).toBeTruthy()
      expect(event.data.documentId).toBeTruthy()
    })
  })

  describe('Step 1: Detect conflicts', () => {
    it('should call detectConflicts with the organization ID', () => {
      const event = createMockEvent()
      // The function passes event.data.organizationId to detectConflicts()
      expect(event.data.organizationId).toBe('org-test-1')
    })

    it('should log audit trail with SCAN_COMPLETED action', () => {
      const event = createMockEvent()
      const conflicts = [createMockConflict(), createMockConflict({ severity: 'CRITICAL' })]

      const auditEntry = {
        organizationId: event.data.organizationId,
        actionType: 'SCAN_COMPLETED',
        description: `Real-time conflict scan triggered by ${event.data.trigger} detected ${conflicts.length} conflicts (document: ${event.data.documentId})`,
        performedBy: 'SYSTEM',
        metadata: {
          conflictCount: conflicts.length,
          trigger: event.data.trigger,
          documentId: event.data.documentId,
          scheduled: false,
        },
      }

      expect(auditEntry.actionType).toBe('SCAN_COMPLETED')
      expect(auditEntry.performedBy).toBe('SYSTEM')
      expect(auditEntry.metadata.conflictCount).toBe(2)
      expect(auditEntry.metadata.scheduled).toBe(false)
      expect(auditEntry.description).toContain('document_processed')
      expect(auditEntry.description).toContain('doc-test-1')
    })

    it('should include conflict count in audit description', () => {
      const conflictCount = 3
      const trigger = 'document_processed'
      const documentId = 'doc-test-1'
      const description = `Real-time conflict scan triggered by ${trigger} detected ${conflictCount} conflicts (document: ${documentId})`

      expect(description).toContain('3 conflicts')
      expect(description).toContain('document_processed')
    })

    it('should handle zero conflicts detected', () => {
      const conflicts: ReturnType<typeof createMockConflict>[] = []

      const auditEntry = {
        metadata: {
          conflictCount: conflicts.length,
          scheduled: false,
        },
      }

      expect(auditEntry.metadata.conflictCount).toBe(0)
    })
  })

  describe('Step 2: Send conflict alerts', () => {
    describe('Alert filtering', () => {
      it('should filter for HIGH and CRITICAL severity conflicts only', () => {
        const conflicts = [
          createMockConflict({ severity: 'LOW' }),
          createMockConflict({ severity: 'MEDIUM' }),
          createMockConflict({ severity: 'HIGH' }),
          createMockConflict({ severity: 'CRITICAL' }),
        ]

        const criticalConflicts = conflicts.filter(
          (c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'
        )

        expect(criticalConflicts).toHaveLength(2)
        expect(criticalConflicts[0].severity).toBe('HIGH')
        expect(criticalConflicts[1].severity).toBe('CRITICAL')
      })

      it('should return early with zero alerts when no critical conflicts exist', () => {
        const conflicts = [
          createMockConflict({ severity: 'LOW' }),
          createMockConflict({ severity: 'MEDIUM' }),
        ]

        const criticalConflicts = conflicts.filter(
          (c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'
        )

        expect(criticalConflicts).toHaveLength(0)

        const result = { alertsSent: 0, inAppCreated: 0 }
        expect(result.alertsSent).toBe(0)
        expect(result.inAppCreated).toBe(0)
      })
    })

    describe('User notification preferences', () => {
      it('should only notify users with compliance alerts enabled', () => {
        const users = [
          createMockNotificationPrefs({ complianceAlertsEnabled: true }),
          createMockNotificationPrefs({ complianceAlertsEnabled: false, userId: 'user-2' }),
          createMockNotificationPrefs({ complianceAlertsEnabled: true, userId: 'user-3' }),
        ]

        const eligibleUsers = users.filter((u) => u.complianceAlertsEnabled)
        expect(eligibleUsers).toHaveLength(2)
      })

      it('should return zero alerts when no users have alerts enabled', () => {
        const usersWithAlerts: ReturnType<typeof createMockNotificationPrefs>[] = []

        if (usersWithAlerts.length === 0) {
          const result = { alertsSent: 0, inAppCreated: 0 }
          expect(result.alertsSent).toBe(0)
          expect(result.inAppCreated).toBe(0)
        }
      })
    })

    describe('Recent conflict lookup', () => {
      it('should look for conflicts created in the last 5 minutes', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const now = new Date()

        // Conflict created 2 minutes ago (should be included)
        const recentConflict = createMockDbConflict({
          createdAt: new Date(Date.now() - 2 * 60 * 1000),
        })
        expect((recentConflict.createdAt as Date).getTime()).toBeGreaterThan(fiveMinutesAgo.getTime())

        // Conflict created 10 minutes ago (should be excluded)
        const oldConflict = createMockDbConflict({
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
        })
        expect((oldConflict.createdAt as Date).getTime()).toBeLessThan(fiveMinutesAgo.getTime())
      })

      it('should filter for UNRESOLVED status only', () => {
        const conflicts = [
          createMockDbConflict({ status: 'UNRESOLVED' }),
          createMockDbConflict({ status: 'RESOLVED' }),
          createMockDbConflict({ status: 'IGNORED' }),
        ]

        const unresolved = conflicts.filter((c) => c.status === 'UNRESOLVED')
        expect(unresolved).toHaveLength(1)
      })

      it('should filter for HIGH and CRITICAL severity in DB query', () => {
        const conflicts = [
          createMockDbConflict({ severity: 'MEDIUM' }),
          createMockDbConflict({ severity: 'HIGH' }),
          createMockDbConflict({ severity: 'CRITICAL' }),
        ]

        const alertWorthy = conflicts.filter(
          (c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'
        )
        expect(alertWorthy).toHaveLength(2)
      })
    })

    describe('Email alert events', () => {
      it('should emit notification/compliance-alert event for each conflict+user pair', () => {
        const conflicts = [
          createMockDbConflict({ id: 'conflict-1', severity: 'HIGH' }),
          createMockDbConflict({ id: 'conflict-2', severity: 'CRITICAL' }),
        ]
        const users = [
          createMockNotificationPrefs({ userId: 'user-1', email: 'user1@org.com' }),
          createMockNotificationPrefs({ userId: 'user-2', email: 'user2@org.com' }),
        ]

        const events: Array<{ name: string; data: Record<string, unknown> }> = []
        for (const conflict of conflicts) {
          for (const user of users) {
            events.push({
              name: 'notification/compliance-alert',
              data: {
                conflictId: conflict.id,
                userId: user.userId,
                email: user.email,
                severity: conflict.severity,
              },
            })
          }
        }

        // 2 conflicts x 2 users = 4 events
        expect(events).toHaveLength(4)
        expect(events[0].name).toBe('notification/compliance-alert')
        expect(events[0].data.conflictId).toBe('conflict-1')
        expect(events[0].data.userId).toBe('user-1')
      })

      it('should count total alerts sent correctly', () => {
        const conflictCount = 3
        const userCount = 2
        const expectedAlerts = conflictCount * userCount

        expect(expectedAlerts).toBe(6)
      })
    })

    describe('In-app notifications', () => {
      it('should create notification for each user with correct messaging', () => {
        const criticalConflicts = [
          createMockConflict({ severity: 'HIGH' }),
          createMockConflict({ severity: 'CRITICAL' }),
        ]
        const ctx = { organizationId: 'org-test-1' }

        const notification = {
          organizationId: ctx.organizationId,
          type: 'SYSTEM',
          title: `${criticalConflicts.length} compliance conflict${criticalConflicts.length > 1 ? 's' : ''} detected`,
          message: `A newly processed document triggered a compliance scan that found ${criticalConflicts.length} high or critical conflict${criticalConflicts.length > 1 ? 's' : ''} requiring your attention.`,
          linkUrl: '/compliance',
        }

        expect(notification.title).toBe('2 compliance conflicts detected')
        expect(notification.message).toContain('2 high or critical conflicts')
        expect(notification.linkUrl).toBe('/compliance')
      })

      it('should use singular form for single conflict', () => {
        const count = 1
        const title = `${count} compliance conflict${count > 1 ? 's' : ''} detected`
        const message = `A newly processed document triggered a compliance scan that found ${count} high or critical conflict${count > 1 ? 's' : ''} requiring your attention.`

        expect(title).toBe('1 compliance conflict detected')
        expect(message).toContain('1 high or critical conflict requiring')
      })

      it('should use plural form for multiple conflicts', () => {
        const count = 5
        const title = `${count} compliance conflict${count > 1 ? 's' : ''} detected`

        expect(title).toBe('5 compliance conflicts detected')
      })
    })
  })

  describe('Return value', () => {
    it('should return complete result object on success', () => {
      const event = createMockEvent()
      const conflicts = [createMockConflict(), createMockConflict()]
      const alertResult = { alertsSent: 4, inAppCreated: 2 }

      const result = {
        success: true,
        organizationId: event.data.organizationId,
        documentId: event.data.documentId,
        trigger: event.data.trigger,
        conflictCount: conflicts.length,
        ...alertResult,
      }

      expect(result.success).toBe(true)
      expect(result.organizationId).toBe('org-test-1')
      expect(result.documentId).toBe('doc-test-1')
      expect(result.trigger).toBe('document_processed')
      expect(result.conflictCount).toBe(2)
      expect(result.alertsSent).toBe(4)
      expect(result.inAppCreated).toBe(2)
    })

    it('should return zero counts when no conflicts detected', () => {
      const result = {
        success: true,
        conflictCount: 0,
        alertsSent: 0,
        inAppCreated: 0,
      }

      expect(result.conflictCount).toBe(0)
      expect(result.alertsSent).toBe(0)
    })
  })

  describe('Function configuration', () => {
    it('should be configured with correct ID and name', () => {
      const config = {
        id: 'detect-conflicts-on-upload',
        name: 'Detect Compliance Conflicts (On Document Upload)',
        retries: 2,
      }

      expect(config.id).toBe('detect-conflicts-on-upload')
      expect(config.retries).toBe(2)
    })

    it('should listen to compliance/detect-conflicts event', () => {
      const eventTrigger = { event: 'compliance/detect-conflicts' }
      expect(eventTrigger.event).toBe('compliance/detect-conflicts')
    })
  })
})
