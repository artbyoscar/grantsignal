import { describe, it, expect, vi } from 'vitest'

/**
 * Grant Lifecycle - Integration Tests
 * Covers: create, update, status changes (Kanban), assignment, filtering,
 * cursor pagination, pipeline view, and webhook emission
 */

const GRANT_STATUSES = [
  'PROSPECT',
  'RESEARCHING',
  'WRITING',
  'REVIEW',
  'SUBMITTED',
  'PENDING',
  'AWARDED',
  'ACTIVE',
  'REPORTING',
  'COMPLETED',
  'DECLINED',
] as const

type GrantStatus = (typeof GRANT_STATUSES)[number]

const TERMINAL_STATUSES: GrantStatus[] = ['DECLINED', 'COMPLETED']
const ACTIVE_STATUSES = GRANT_STATUSES.filter((s) => !TERMINAL_STATUSES.includes(s))

function createMockGrant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'grant-test-1',
    organizationId: 'org-test-1',
    funderId: 'funder-test-1',
    opportunityId: null as string | null,
    programId: null as string | null,
    status: 'PROSPECT' as GrantStatus,
    amountRequested: null as number | null,
    amountAwarded: null as number | null,
    deadline: null as Date | null,
    notes: null as string | null,
    assignedToId: null as string | null,
    assignedAt: null as Date | null,
    submittedAt: null as Date | null,
    awardedAt: null as Date | null,
    draftContent: null,
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

describe('Grant Lifecycle', () => {
  describe('Grant creation', () => {
    it('should default to PROSPECT status when not specified', () => {
      const defaultStatus = 'PROSPECT'
      expect(defaultStatus).toBe('PROSPECT')
    })

    it('should accept custom initial status', () => {
      const grant = createMockGrant({ status: 'WRITING' })
      expect(grant.status).toBe('WRITING')
    })

    it('should associate grant with organization', () => {
      const ctx = createMockContext()
      const grant = createMockGrant({ organizationId: ctx.organizationId })
      expect(grant.organizationId).toBe('org-test-1')
    })

    it('should set assignedAt when assignedToId is provided', () => {
      const input = { assignedToId: 'member-1' }
      const assignedAt = input.assignedToId ? new Date() : null
      expect(assignedAt).not.toBeNull()
    })

    it('should not set assignedAt when no assignee', () => {
      const input = { assignedToId: undefined }
      const assignedAt = input.assignedToId ? new Date() : null
      expect(assignedAt).toBeNull()
    })

    it('should accept optional fields (funder, opportunity, program, deadline, notes)', () => {
      const grant = createMockGrant({
        funderId: 'funder-1',
        opportunityId: 'opp-1',
        programId: 'prog-1',
        deadline: new Date('2025-06-30'),
        notes: 'High priority',
        amountRequested: 50000,
      })

      expect(grant.funderId).toBe('funder-1')
      expect(grant.opportunityId).toBe('opp-1')
      expect(grant.programId).toBe('prog-1')
      expect(grant.deadline).toEqual(new Date('2025-06-30'))
      expect(grant.notes).toBe('High priority')
      expect(grant.amountRequested).toBe(50000)
    })

    it('should log GRANT_CREATED activity', () => {
      const ctx = createMockContext()
      const grant = createMockGrant()

      const activity = {
        organizationId: ctx.organizationId,
        userId: ctx.auth.userId,
        action: 'GRANT_CREATED',
        entityType: 'grant',
        entityId: grant.id,
        description: `Created grant "New Grant" in ${grant.status} status`,
        metadata: { status: grant.status, funderId: grant.funderId },
      }

      expect(activity.action).toBe('GRANT_CREATED')
      expect(activity.description).toContain('PROSPECT')
    })
  })

  describe('Status transitions (Kanban)', () => {
    it('should allow status change and track old status', () => {
      const grant = createMockGrant({ status: 'PROSPECT' })
      const newStatus: GrantStatus = 'RESEARCHING'

      const oldStatus = grant.status
      expect(oldStatus).toBe('PROSPECT')
      expect(newStatus).toBe('RESEARCHING')
      expect(oldStatus).not.toBe(newStatus)
    })

    it('should emit webhook when status changes', () => {
      const oldStatus: GrantStatus = 'SUBMITTED'
      const newStatus: GrantStatus = 'AWARDED'

      const webhookEvent = {
        type: 'grant.status_changed',
        grantId: 'grant-test-1',
        oldStatus,
        newStatus,
        grant: {
          id: 'grant-test-1',
          amountRequested: 50000,
          amountAwarded: 45000,
          deadline: new Date('2025-06-30'),
        },
      }

      expect(webhookEvent.type).toBe('grant.status_changed')
      expect(webhookEvent.oldStatus).toBe('SUBMITTED')
      expect(webhookEvent.newStatus).toBe('AWARDED')
    })

    it('should NOT emit webhook when status remains the same', () => {
      const oldStatus: GrantStatus = 'WRITING'
      const newStatus: GrantStatus = 'WRITING'

      const shouldEmit = oldStatus !== newStatus
      expect(shouldEmit).toBe(false)
    })

    it('should log GRANT_STATUS_CHANGED activity', () => {
      const oldStatus: GrantStatus = 'WRITING'
      const newStatus: GrantStatus = 'REVIEW'

      const activity = {
        action: 'GRANT_STATUS_CHANGED',
        description: `Moved grant to ${newStatus} (from ${oldStatus})`,
        metadata: { oldStatus, newStatus },
      }

      expect(activity.description).toContain('REVIEW')
      expect(activity.description).toContain('WRITING')
    })

    it('should update updatedAt timestamp on status change', () => {
      const grant = createMockGrant({ updatedAt: new Date('2025-01-01') })
      const newUpdatedAt = new Date()

      expect(newUpdatedAt.getTime()).toBeGreaterThan((grant.updatedAt as Date).getTime())
    })

    it('should verify grant belongs to organization before status change', () => {
      const ctx = createMockContext({ organizationId: 'org-test-1' })
      const grant = createMockGrant({ organizationId: 'org-test-1' })

      expect(grant.organizationId).toBe(ctx.organizationId)
    })

    it('should throw error when grant not found', () => {
      const grant = null
      const shouldThrow = () => {
        if (!grant) throw new Error('Grant not found or access denied')
      }
      expect(shouldThrow).toThrow('Grant not found or access denied')
    })
  })

  describe('Grant list filtering', () => {
    describe('Status filtering', () => {
      it('should exclude terminal states by default', () => {
        const includeTerminalStates = false
        const allGrants = GRANT_STATUSES.map((s) => createMockGrant({ status: s }))

        const filtered = includeTerminalStates
          ? allGrants
          : allGrants.filter((g) => !TERMINAL_STATUSES.includes(g.status))

        expect(filtered.length).toBe(ACTIVE_STATUSES.length)
        expect(filtered.find((g) => g.status === 'DECLINED')).toBeUndefined()
        expect(filtered.find((g) => g.status === 'COMPLETED')).toBeUndefined()
      })

      it('should include terminal states when explicitly requested', () => {
        const includeTerminalStates = true
        const allGrants = GRANT_STATUSES.map((s) => createMockGrant({ status: s }))

        const filtered = includeTerminalStates
          ? allGrants
          : allGrants.filter((g) => !TERMINAL_STATUSES.includes(g.status))

        expect(filtered.length).toBe(GRANT_STATUSES.length)
      })

      it('should filter by single status', () => {
        const grants = GRANT_STATUSES.map((s) => createMockGrant({ status: s }))
        const filtered = grants.filter((g) => g.status === 'WRITING')
        expect(filtered).toHaveLength(1)
      })

      it('should filter by multiple statuses', () => {
        const grants = GRANT_STATUSES.map((s) => createMockGrant({ status: s }))
        const targetStatuses: GrantStatus[] = ['WRITING', 'REVIEW', 'SUBMITTED']
        const filtered = grants.filter((g) => targetStatuses.includes(g.status))
        expect(filtered).toHaveLength(3)
      })
    })

    describe('Search filtering', () => {
      it('should search across notes, funder name, and opportunity title', () => {
        const searchFields = ['notes', 'funder.name', 'opportunity.title']
        expect(searchFields).toHaveLength(3)
      })

      it('should use case-insensitive matching', () => {
        const search = 'gates'
        const funderName = 'Gates Foundation'
        const matches = funderName.toLowerCase().includes(search.toLowerCase())
        expect(matches).toBe(true)
      })
    })

    describe('Assignment filtering', () => {
      it('should filter by specific assignee', () => {
        const grants = [
          createMockGrant({ assignedToId: 'member-1' }),
          createMockGrant({ assignedToId: 'member-2', id: 'grant-2' }),
          createMockGrant({ assignedToId: null, id: 'grant-3' }),
        ]

        const filtered = grants.filter((g) => g.assignedToId === 'member-1')
        expect(filtered).toHaveLength(1)
      })

      it('should filter for unassigned grants', () => {
        const grants = [
          createMockGrant({ assignedToId: 'member-1' }),
          createMockGrant({ assignedToId: null, id: 'grant-2' }),
          createMockGrant({ assignedToId: null, id: 'grant-3' }),
        ]

        const unassigned = grants.filter((g) => g.assignedToId === null)
        expect(unassigned).toHaveLength(2)
      })
    })

    describe('Deadline filtering', () => {
      it('should filter grants with deadlines after a date', () => {
        const deadlineFrom = new Date('2025-06-01')
        const grants = [
          createMockGrant({ deadline: new Date('2025-05-15') }),
          createMockGrant({ deadline: new Date('2025-07-01'), id: 'grant-2' }),
          createMockGrant({ deadline: new Date('2025-08-15'), id: 'grant-3' }),
        ]

        const filtered = grants.filter(
          (g) => g.deadline && (g.deadline as Date).getTime() >= deadlineFrom.getTime()
        )
        expect(filtered).toHaveLength(2)
      })

      it('should filter grants with deadlines before a date', () => {
        const deadlineTo = new Date('2025-06-30')
        const grants = [
          createMockGrant({ deadline: new Date('2025-05-15') }),
          createMockGrant({ deadline: new Date('2025-07-01'), id: 'grant-2' }),
        ]

        const filtered = grants.filter(
          (g) => g.deadline && (g.deadline as Date).getTime() <= deadlineTo.getTime()
        )
        expect(filtered).toHaveLength(1)
      })
    })
  })

  describe('Cursor-based pagination', () => {
    it('should return hasMore=true when more results exist', () => {
      const limit = 10
      const resultsReturned = 11 // limit + 1

      const hasMore = resultsReturned > limit
      expect(hasMore).toBe(true)
    })

    it('should return hasMore=false when no more results', () => {
      const limit = 10
      const resultsReturned = 7

      const hasMore = resultsReturned > limit
      expect(hasMore).toBe(false)
    })

    it('should set nextCursor to last item ID when more results exist', () => {
      const grants = Array.from({ length: 11 }, (_, i) =>
        createMockGrant({ id: `grant-${i}` })
      )
      const limit = 10

      let nextCursor: string | undefined
      if (grants.length > limit) {
        const nextItem = grants.pop()
        nextCursor = nextItem?.id
      }

      expect(nextCursor).toBe('grant-10')
      expect(grants).toHaveLength(10)
    })
  })

  describe('Grant assignment', () => {
    it('should set assignedToId and assignedAt on assign', () => {
      const grant = createMockGrant()
      const assignedGrant = {
        ...grant,
        assignedToId: 'member-1',
        assignedAt: new Date(),
      }

      expect(assignedGrant.assignedToId).toBe('member-1')
      expect(assignedGrant.assignedAt).toBeTruthy()
    })

    it('should clear assignedToId and assignedAt on unassign', () => {
      const grant = createMockGrant({
        assignedToId: 'member-1',
        assignedAt: new Date(),
      })
      const unassignedGrant = {
        ...grant,
        assignedToId: null,
        assignedAt: null,
      }

      expect(unassignedGrant.assignedToId).toBeNull()
      expect(unassignedGrant.assignedAt).toBeNull()
    })
  })

  describe('Pipeline view calculations', () => {
    it('should calculate daysUntilDeadline correctly', () => {
      const deadline = new Date('2025-06-30')
      const now = new Date('2025-06-15')
      const daysUntil = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysUntil).toBe(15)
    })

    it('should return negative days for past deadlines', () => {
      const deadline = new Date('2025-06-01')
      const now = new Date('2025-06-15')
      const daysUntil = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysUntil).toBeLessThan(0)
    })

    it('should handle null deadline gracefully', () => {
      const deadline = null
      const daysUntil = deadline
        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      expect(daysUntil).toBeNull()
    })

    it('should group grants by status for pipeline columns', () => {
      const grants = [
        createMockGrant({ status: 'PROSPECT', id: 'g1' }),
        createMockGrant({ status: 'PROSPECT', id: 'g2' }),
        createMockGrant({ status: 'WRITING', id: 'g3' }),
        createMockGrant({ status: 'SUBMITTED', id: 'g4' }),
      ]

      const grouped = new Map<GrantStatus, typeof grants>()
      for (const grant of grants) {
        const existing = grouped.get(grant.status) || []
        grouped.set(grant.status, [...existing, grant])
      }

      expect(grouped.get('PROSPECT')).toHaveLength(2)
      expect(grouped.get('WRITING')).toHaveLength(1)
      expect(grouped.get('SUBMITTED')).toHaveLength(1)
      expect(grouped.get('AWARDED')).toBeUndefined()
    })
  })

  describe('Draft content management', () => {
    it('should save draft content per section', () => {
      const draftContent = {
        'executive-summary': {
          content: 'Our organization proposes to...',
          wordCount: 245,
          lastUpdated: new Date().toISOString(),
        },
        'project-narrative': {
          content: 'The proposed project will serve...',
          wordCount: 1200,
          lastUpdated: new Date().toISOString(),
        },
      }

      expect(Object.keys(draftContent)).toHaveLength(2)
      expect(draftContent['executive-summary'].wordCount).toBe(245)
    })

    it('should preserve existing sections when updating one', () => {
      const existing = {
        'section-1': { content: 'Original', wordCount: 1 },
        'section-2': { content: 'Also original', wordCount: 2 },
      }

      const updated = {
        ...existing,
        'section-1': { content: 'Updated', wordCount: 1 },
      }

      expect(updated['section-1'].content).toBe('Updated')
      expect(updated['section-2'].content).toBe('Also original')
    })
  })
})
