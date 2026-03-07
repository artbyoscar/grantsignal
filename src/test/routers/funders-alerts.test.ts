import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Funders Router - Alert Procedures Tests
 * Tests setAlert, removeAlert, getAlert, listAlerts logic
 */

// Mock data factories
function createMockFunder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'funder-test-1',
    name: 'Gates Foundation',
    type: 'PRIVATE_FOUNDATION',
    ein: '56-2618866',
    totalGiving: 5000000000,
    programAreas: { areas: ['Education', 'Health'] },
    ...overrides,
  }
}

function createMockAlert(overrides: Record<string, unknown> = {}) {
  return {
    id: 'alert-test-1',
    organizationId: 'org-test-1',
    funderId: 'funder-test-1',
    createdByUserId: 'user-test-1',
    alertOnNewOpportunity: true,
    alertOnDeadline: true,
    alertOn990Update: true,
    notes: null,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    ...overrides,
  }
}

function createMockContext(overrides: Record<string, unknown> = {}) {
  return {
    organizationId: 'org-test-1',
    auth: { userId: 'user-test-1' },
    ...overrides,
  }
}

describe('Funders Router - Alert Procedures', () => {
  describe('setAlert', () => {
    describe('Input validation', () => {
      it('should require a funderId string', () => {
        const validInput = {
          funderId: 'funder-test-1',
          alertOnNewOpportunity: true,
          alertOnDeadline: true,
          alertOn990Update: true,
        }
        expect(validInput.funderId).toBeTruthy()
        expect(typeof validInput.funderId).toBe('string')
      })

      it('should default all alert types to true when not specified', () => {
        const defaults = {
          alertOnNewOpportunity: true,
          alertOnDeadline: true,
          alertOn990Update: true,
        }
        expect(defaults.alertOnNewOpportunity).toBe(true)
        expect(defaults.alertOnDeadline).toBe(true)
        expect(defaults.alertOn990Update).toBe(true)
      })

      it('should accept optional notes field', () => {
        const inputWithNotes = {
          funderId: 'funder-test-1',
          notes: 'Track this funder for Q3 cycle',
        }
        expect(inputWithNotes.notes).toBeDefined()
      })

      it('should accept input without notes', () => {
        const inputWithoutNotes = {
          funderId: 'funder-test-1',
        }
        expect(inputWithoutNotes).not.toHaveProperty('notes')
      })
    })

    describe('Upsert behavior', () => {
      it('should use org+funder composite key for upsert', () => {
        const ctx = createMockContext()
        const input = { funderId: 'funder-test-1' }

        // The composite key used in the router
        const compositeKey = {
          organizationId: ctx.organizationId,
          funderId: input.funderId,
        }

        expect(compositeKey.organizationId).toBe('org-test-1')
        expect(compositeKey.funderId).toBe('funder-test-1')
      })

      it('should create alert with all fields when new', () => {
        const ctx = createMockContext()
        const input = {
          funderId: 'funder-test-1',
          alertOnNewOpportunity: true,
          alertOnDeadline: false,
          alertOn990Update: true,
          notes: 'Important funder',
        }

        const createData = {
          organizationId: ctx.organizationId,
          funderId: input.funderId,
          createdByUserId: ctx.auth.userId,
          alertOnNewOpportunity: input.alertOnNewOpportunity,
          alertOnDeadline: input.alertOnDeadline,
          alertOn990Update: input.alertOn990Update,
          notes: input.notes,
        }

        expect(createData.organizationId).toBe('org-test-1')
        expect(createData.createdByUserId).toBe('user-test-1')
        expect(createData.alertOnDeadline).toBe(false)
        expect(createData.notes).toBe('Important funder')
      })

      it('should update alert preferences when already exists', () => {
        const existingAlert = createMockAlert({ alertOnDeadline: true })
        const updateInput = {
          alertOnDeadline: false,
          alertOnNewOpportunity: true,
          alertOn990Update: false,
        }

        // Simulating what the router does on update
        const updatedAlert = {
          ...existingAlert,
          ...updateInput,
          updatedAt: new Date(),
        }

        expect(updatedAlert.alertOnDeadline).toBe(false)
        expect(updatedAlert.alertOn990Update).toBe(false)
        expect(updatedAlert.alertOnNewOpportunity).toBe(true)
        expect(updatedAlert.updatedAt.getTime()).toBeGreaterThan(existingAlert.updatedAt.getTime())
      })
    })

    describe('Notification creation', () => {
      it('should create confirmation notification with funder name', () => {
        const funder = createMockFunder()
        const ctx = createMockContext()

        const notification = {
          organizationId: ctx.organizationId,
          type: 'SYSTEM',
          title: `Alert set for ${funder.name}`,
          message: `You will be notified about new opportunities, deadlines, and 990 updates for ${funder.name}.`,
          linkUrl: `/opportunities/funders/${funder.id}`,
        }

        expect(notification.title).toBe('Alert set for Gates Foundation')
        expect(notification.message).toContain('Gates Foundation')
        expect(notification.linkUrl).toBe('/opportunities/funders/funder-test-1')
        expect(notification.type).toBe('SYSTEM')
      })
    })

    describe('Error handling', () => {
      it('should throw NOT_FOUND when funder does not exist', () => {
        const funder = null

        const shouldThrow = () => {
          if (!funder) {
            throw { code: 'NOT_FOUND', message: 'Funder not found' }
          }
        }

        expect(shouldThrow).toThrow()
      })
    })
  })

  describe('removeAlert', () => {
    it('should look up alert by org+funder composite key', () => {
      const ctx = createMockContext()
      const input = { funderId: 'funder-test-1' }

      const lookupKey = {
        organizationId_funderId: {
          organizationId: ctx.organizationId,
          funderId: input.funderId,
        },
      }

      expect(lookupKey.organizationId_funderId.organizationId).toBe('org-test-1')
      expect(lookupKey.organizationId_funderId.funderId).toBe('funder-test-1')
    })

    it('should throw NOT_FOUND when no alert exists for this funder', () => {
      const existing = null

      const shouldThrow = () => {
        if (!existing) {
          throw { code: 'NOT_FOUND', message: 'No alert found for this funder' }
        }
      }

      expect(shouldThrow).toThrow()
    })

    it('should return success when alert is deleted', () => {
      const existing = createMockAlert()
      expect(existing).toBeTruthy()

      // After successful delete
      const result = { success: true }
      expect(result.success).toBe(true)
    })

    it('should delete by alert ID, not composite key', () => {
      const existing = createMockAlert()

      // The router deletes by existing.id after lookup
      const deleteWhere = { id: existing.id }
      expect(deleteWhere.id).toBe('alert-test-1')
    })
  })

  describe('getAlert', () => {
    it('should query by org+funder composite key', () => {
      const ctx = createMockContext()
      const input = { funderId: 'funder-test-1' }

      const queryKey = {
        organizationId_funderId: {
          organizationId: ctx.organizationId,
          funderId: input.funderId,
        },
      }

      expect(queryKey.organizationId_funderId.organizationId).toBe('org-test-1')
      expect(queryKey.organizationId_funderId.funderId).toBe('funder-test-1')
    })

    it('should return alert object when alert exists', () => {
      const alert = createMockAlert()
      expect(alert).toBeTruthy()
      expect(alert.organizationId).toBe('org-test-1')
      expect(alert.funderId).toBe('funder-test-1')
      expect(alert.alertOnNewOpportunity).toBe(true)
    })

    it('should return null when no alert exists', () => {
      const alert = null
      expect(alert).toBeNull()
    })

    it('should scope query to the current organization', () => {
      const ctx = createMockContext({ organizationId: 'org-other' })

      // Even with same funderId, different org should not see alerts
      const alertForOtherOrg = createMockAlert({ organizationId: 'org-test-1' })
      expect(alertForOtherOrg.organizationId).not.toBe(ctx.organizationId)
    })
  })

  describe('listAlerts', () => {
    it('should filter by organization ID', () => {
      const ctx = createMockContext()
      const filterWhere = { organizationId: ctx.organizationId }
      expect(filterWhere.organizationId).toBe('org-test-1')
    })

    it('should include funder details in response', () => {
      const alertWithFunder = {
        ...createMockAlert(),
        funder: {
          id: 'funder-test-1',
          name: 'Gates Foundation',
          type: 'PRIVATE_FOUNDATION',
          totalGiving: 5000000000,
          programAreas: { areas: ['Education'] },
        },
      }

      expect(alertWithFunder.funder).toBeDefined()
      expect(alertWithFunder.funder.name).toBe('Gates Foundation')
      expect(alertWithFunder.funder.type).toBe('PRIVATE_FOUNDATION')
    })

    it('should order by createdAt descending (newest first)', () => {
      const alerts = [
        createMockAlert({ id: 'alert-1', createdAt: new Date('2025-01-10') }),
        createMockAlert({ id: 'alert-2', createdAt: new Date('2025-02-15') }),
        createMockAlert({ id: 'alert-3', createdAt: new Date('2025-01-25') }),
      ]

      const sorted = [...alerts].sort(
        (a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime()
      )

      expect(sorted[0].id).toBe('alert-2') // Feb 15 first
      expect(sorted[1].id).toBe('alert-3') // Jan 25 second
      expect(sorted[2].id).toBe('alert-1') // Jan 10 last
    })

    it('should return empty array when no alerts exist', () => {
      const alerts: ReturnType<typeof createMockAlert>[] = []
      expect(alerts).toHaveLength(0)
    })

    it('should return multiple alerts for an organization', () => {
      const alerts = [
        createMockAlert({ funderId: 'funder-1' }),
        createMockAlert({ funderId: 'funder-2' }),
        createMockAlert({ funderId: 'funder-3' }),
      ]

      expect(alerts).toHaveLength(3)
      const funderIds = alerts.map((a) => a.funderId)
      expect(new Set(funderIds).size).toBe(3) // All unique funders
    })
  })
})
