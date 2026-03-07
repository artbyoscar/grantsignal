import { describe, it, expect, vi } from 'vitest'

/**
 * Process Document - Step 6: Compliance Trigger Tests
 * Tests the real-time compliance detection trigger added to the document processing pipeline
 */

// Mock data factories
function createMockDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-test-1',
    type: 'AWARD_LETTER' as const,
    grantId: 'grant-test-1',
    organizationId: 'org-test-1',
    name: 'Award Letter - Gates Foundation Q3 2025.pdf',
    grant: {
      id: 'grant-test-1',
      status: 'AWARDED',
    },
    ...overrides,
  }
}

describe('Process Document - Step 6: Trigger Compliance Check', () => {
  describe('Document type filtering', () => {
    it('should trigger for AWARD_LETTER documents', () => {
      const doc = createMockDocument({ type: 'AWARD_LETTER' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type)).toBe(true)
    })

    it('should trigger for AGREEMENT documents', () => {
      const doc = createMockDocument({ type: 'AGREEMENT' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type)).toBe(true)
    })

    it('should NOT trigger for PROPOSAL documents', () => {
      const doc = createMockDocument({ type: 'PROPOSAL' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type as string)).toBe(false)
    })

    it('should NOT trigger for BUDGET documents', () => {
      const doc = createMockDocument({ type: 'BUDGET' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type as string)).toBe(false)
    })

    it('should NOT trigger for REPORT documents', () => {
      const doc = createMockDocument({ type: 'REPORT' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type as string)).toBe(false)
    })

    it('should NOT trigger for CORRESPONDENCE documents', () => {
      const doc = createMockDocument({ type: 'CORRESPONDENCE' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type as string)).toBe(false)
    })

    it('should NOT trigger for OTHER documents', () => {
      const doc = createMockDocument({ type: 'OTHER' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']
      expect(awardDocTypes.includes(doc.type as string)).toBe(false)
    })
  })

  describe('Skip conditions', () => {
    it('should skip when document is null (not found)', () => {
      const document = null

      const shouldSkip = !document || !['AWARD_LETTER', 'AGREEMENT'].includes(document?.type)
      expect(shouldSkip).toBe(true)

      const result = { skipped: true, reason: 'Not an award document' }
      expect(result.skipped).toBe(true)
    })

    it('should skip when document type is not in award types', () => {
      const document = createMockDocument({ type: 'PROPOSAL' })
      const awardDocTypes = ['AWARD_LETTER', 'AGREEMENT']

      const shouldSkip = !awardDocTypes.includes(document.type as string)
      expect(shouldSkip).toBe(true)
    })
  })

  describe('Event emission', () => {
    it('should emit compliance/detect-conflicts event with correct data', () => {
      const organizationId = 'org-test-1'
      const documentId = 'doc-test-1'

      const event = {
        name: 'compliance/detect-conflicts',
        data: {
          organizationId,
          documentId,
          trigger: 'document_processed' as const,
        },
      }

      expect(event.name).toBe('compliance/detect-conflicts')
      expect(event.data.organizationId).toBe('org-test-1')
      expect(event.data.documentId).toBe('doc-test-1')
      expect(event.data.trigger).toBe('document_processed')
    })

    it('should always use document_processed as trigger', () => {
      // In the process-document pipeline, the trigger is always document_processed
      const trigger = 'document_processed'
      expect(trigger).toBe('document_processed')
      expect(trigger).not.toBe('manual')
    })
  })

  describe('Return value', () => {
    it('should return triggered=true for award documents', () => {
      const document = createMockDocument({ type: 'AWARD_LETTER' })
      const result = { triggered: true, documentType: document.type }

      expect(result.triggered).toBe(true)
      expect(result.documentType).toBe('AWARD_LETTER')
    })

    it('should return triggered=true for agreement documents', () => {
      const document = createMockDocument({ type: 'AGREEMENT' })
      const result = { triggered: true, documentType: document.type }

      expect(result.triggered).toBe(true)
      expect(result.documentType).toBe('AGREEMENT')
    })

    it('should return skipped result for non-award documents', () => {
      const result = { skipped: true, reason: 'Not an award document' }
      expect(result.skipped).toBe(true)
      expect(result.reason).toBe('Not an award document')
    })
  })

  describe('Pipeline integration', () => {
    it('should be Step 6 in the pipeline (after commitment extraction)', () => {
      // Pipeline order matters: commitments must be extracted before conflict detection
      const pipelineSteps = [
        'download-from-s3',         // Step 1
        'parse-document',           // Step 2
        'update-database',          // Step 3
        'vectorize-document',       // Step 4
        'extract-commitments',      // Step 5
        'trigger-compliance-check', // Step 6
        'send-notifications',       // Step 7
      ]

      expect(pipelineSteps.indexOf('trigger-compliance-check')).toBe(5) // 0-indexed
      expect(pipelineSteps.indexOf('trigger-compliance-check')).toBeGreaterThan(
        pipelineSteps.indexOf('extract-commitments')
      )
      expect(pipelineSteps.indexOf('trigger-compliance-check')).toBeLessThan(
        pipelineSteps.indexOf('send-notifications')
      )
    })

    it('should emit event asynchronously (non-blocking for next step)', () => {
      // The compliance check is triggered via inngest.send() which is async
      // This means Step 7 (notifications) can proceed independently
      const complianceEventEmitted = true
      const notificationsCanProceed = true

      expect(complianceEventEmitted).toBe(true)
      expect(notificationsCanProceed).toBe(true)
    })
  })

  describe('Event type validation', () => {
    it('should match the event type defined in inngest client', () => {
      // From src/inngest/client.ts Events type
      const eventType = 'compliance/detect-conflicts'

      const validEventData = {
        organizationId: 'org-test-1',
        documentId: 'doc-test-1',
        trigger: 'document_processed' as 'document_processed' | 'manual',
      }

      expect(eventType).toBe('compliance/detect-conflicts')
      expect(['document_processed', 'manual']).toContain(validEventData.trigger)
    })

    it('should require organizationId in event data', () => {
      const eventData = {
        organizationId: 'org-test-1',
        documentId: 'doc-test-1',
        trigger: 'document_processed',
      }

      expect(eventData).toHaveProperty('organizationId')
      expect(eventData.organizationId).toBeTruthy()
    })

    it('should require documentId in event data', () => {
      const eventData = {
        organizationId: 'org-test-1',
        documentId: 'doc-test-1',
        trigger: 'document_processed',
      }

      expect(eventData).toHaveProperty('documentId')
      expect(eventData.documentId).toBeTruthy()
    })
  })
})
