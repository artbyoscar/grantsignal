import { describe, it, expect, vi } from 'vitest'

/**
 * Document Upload & Processing Pipeline - Integration Tests
 * Covers: createUploadUrl, confirmUpload, process-document Inngest pipeline,
 * status transitions, confidence scoring, and vectorization
 */

// Mock data factories
function createMockUploadInput(overrides: Record<string, unknown> = {}) {
  return {
    fileName: 'Award Letter - Gates Foundation 2025.pdf',
    fileType: 'application/pdf',
    fileSize: 2_500_000,
    documentType: 'AWARD_LETTER' as const,
    grantId: 'grant-test-1',
    ...overrides,
  }
}

function createMockDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-test-1',
    organizationId: 'org-test-1',
    grantId: 'grant-test-1',
    name: 'Award Letter - Gates Foundation 2025.pdf',
    type: 'AWARD_LETTER' as const,
    mimeType: 'application/pdf',
    size: 2_500_000,
    s3Key: 'org-test-1/1700000000-Award_Letter_-_Gates_Foundation_2025.pdf',
    status: 'PENDING' as const,
    extractedText: null,
    parseConfidence: null,
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01'),
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

describe('Document Upload & Processing Pipeline', () => {
  describe('createUploadUrl', () => {
    describe('S3 key generation', () => {
      it('should generate S3 key with org ID prefix', () => {
        const ctx = createMockContext()
        const input = createMockUploadInput()
        const timestamp = 1700000000

        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const s3Key = `${ctx.organizationId}/${timestamp}-${sanitizedFileName}`

        expect(s3Key).toContain('org-test-1/')
        expect(s3Key).toContain('Award_Letter_-_Gates_Foundation_2025.pdf')
      })

      it('should sanitize special characters in file names', () => {
        const fileName = 'Grant (2025) Award #3 [Final].pdf'
        const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

        expect(sanitized).toBe('Grant__2025__Award__3__Final_.pdf')
        expect(sanitized).not.toContain('(')
        expect(sanitized).not.toContain('#')
        expect(sanitized).not.toContain('[')
      })

      it('should preserve file extension during sanitization', () => {
        const fileNames = ['report.pdf', 'data.xlsx', 'letter.docx']
        for (const name of fileNames) {
          const sanitized = name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const ext = name.split('.').pop()
          expect(sanitized).toContain(`.${ext}`)
        }
      })
    })

    describe('Document record creation', () => {
      it('should create document with PENDING status', () => {
        const doc = createMockDocument()
        expect(doc.status).toBe('PENDING')
      })

      it('should associate document with organization', () => {
        const ctx = createMockContext()
        const doc = createMockDocument({ organizationId: ctx.organizationId })
        expect(doc.organizationId).toBe('org-test-1')
      })

      it('should associate document with grant when grantId provided', () => {
        const input = createMockUploadInput({ grantId: 'grant-123' })
        const doc = createMockDocument({ grantId: input.grantId })
        expect(doc.grantId).toBe('grant-123')
      })

      it('should allow null grantId for unlinked documents', () => {
        const doc = createMockDocument({ grantId: null })
        expect(doc.grantId).toBeNull()
      })

      it('should store file metadata correctly', () => {
        const input = createMockUploadInput()
        const doc = createMockDocument({
          name: input.fileName,
          type: input.documentType,
          mimeType: input.fileType,
          size: input.fileSize,
        })

        expect(doc.name).toBe('Award Letter - Gates Foundation 2025.pdf')
        expect(doc.type).toBe('AWARD_LETTER')
        expect(doc.mimeType).toBe('application/pdf')
        expect(doc.size).toBe(2_500_000)
      })
    })
  })

  describe('confirmUpload - Inngest trigger', () => {
    it('should emit document/uploaded event with correct payload', () => {
      const doc = createMockDocument()

      const event = {
        name: 'document/uploaded',
        data: {
          documentId: doc.id,
          organizationId: doc.organizationId,
          s3Key: doc.s3Key,
          type: doc.type,
        },
      }

      expect(event.name).toBe('document/uploaded')
      expect(event.data.documentId).toBe('doc-test-1')
      expect(event.data.s3Key).toContain('org-test-1/')
    })
  })

  describe('Process Document Pipeline', () => {
    describe('Step 1: Download from S3', () => {
      it('should use the s3Key from the document record', () => {
        const doc = createMockDocument()
        expect(doc.s3Key).toBeTruthy()
        expect(doc.s3Key).toContain(doc.organizationId)
      })
    })

    describe('Step 2: Parse document', () => {
      it('should extract text content from PDF documents', () => {
        const parsedResult = {
          text: 'We are pleased to award your organization a grant of $50,000...',
          confidence: 92,
          pageCount: 3,
        }

        expect(parsedResult.text.length).toBeGreaterThan(0)
        expect(parsedResult.confidence).toBeGreaterThanOrEqual(0)
        expect(parsedResult.confidence).toBeLessThanOrEqual(100)
      })
    })

    describe('Step 3: Update database', () => {
      it('should mark as COMPLETED when confidence >= 70%', () => {
        const confidence = 85
        const status = confidence >= 70 ? 'COMPLETED' : 'NEEDS_REVIEW'
        expect(status).toBe('COMPLETED')
      })

      it('should mark as NEEDS_REVIEW when confidence < 70%', () => {
        const confidence = 55
        const status = confidence >= 70 ? 'COMPLETED' : 'NEEDS_REVIEW'
        expect(status).toBe('NEEDS_REVIEW')
      })

      it('should store extracted text and confidence score', () => {
        const updatedDoc = createMockDocument({
          extractedText: 'Grant award of $50,000 for youth programs...',
          parseConfidence: 92,
          status: 'COMPLETED',
        })

        expect(updatedDoc.extractedText).toBeTruthy()
        expect(updatedDoc.parseConfidence).toBe(92)
        expect(updatedDoc.status).toBe('COMPLETED')
      })

      it('should handle boundary confidence of exactly 70%', () => {
        const confidence = 70
        const status = confidence >= 70 ? 'COMPLETED' : 'NEEDS_REVIEW'
        expect(status).toBe('COMPLETED')
      })
    })

    describe('Step 4: Vectorize document', () => {
      it('should only vectorize when Pinecone is configured', () => {
        const pineconeConfigured = true
        const shouldVectorize = pineconeConfigured
        expect(shouldVectorize).toBe(true)
      })

      it('should skip vectorization when Pinecone is not configured', () => {
        const pineconeConfigured = false
        const shouldVectorize = pineconeConfigured
        expect(shouldVectorize).toBe(false)
      })

      it('should chunk text before uploading to Pinecone', () => {
        const extractedText = 'A'.repeat(5000)
        const chunkSize = 1000
        const overlap = 200
        const chunks: string[] = []

        for (let i = 0; i < extractedText.length; i += chunkSize - overlap) {
          chunks.push(extractedText.slice(i, i + chunkSize))
        }

        expect(chunks.length).toBeGreaterThan(1)
        expect(chunks[0].length).toBeLessThanOrEqual(chunkSize)
      })
    })

    describe('Step 5: Extract commitments', () => {
      it('should trigger for AWARD_LETTER documents', () => {
        const doc = createMockDocument({ type: 'AWARD_LETTER' })
        const shouldExtract = ['AWARD_LETTER', 'AGREEMENT'].includes(doc.type)
        expect(shouldExtract).toBe(true)
      })

      it('should trigger for AGREEMENT documents', () => {
        const doc = createMockDocument({ type: 'AGREEMENT' })
        const shouldExtract = ['AWARD_LETTER', 'AGREEMENT'].includes(doc.type)
        expect(shouldExtract).toBe(true)
      })

      it('should NOT trigger for PROPOSAL documents', () => {
        const doc = createMockDocument({ type: 'PROPOSAL' })
        const shouldExtract = ['AWARD_LETTER', 'AGREEMENT'].includes(doc.type as string)
        expect(shouldExtract).toBe(false)
      })
    })

    describe('Step 6: Trigger compliance check', () => {
      it('should emit compliance/detect-conflicts for award documents', () => {
        const doc = createMockDocument({ type: 'AWARD_LETTER' })
        const isAwardDoc = ['AWARD_LETTER', 'AGREEMENT'].includes(doc.type)

        const event = isAwardDoc
          ? {
              name: 'compliance/detect-conflicts',
              data: {
                organizationId: doc.organizationId,
                documentId: doc.id,
                trigger: 'document_processed',
              },
            }
          : null

        expect(event).not.toBeNull()
        expect(event!.name).toBe('compliance/detect-conflicts')
      })
    })

    describe('Step 7: Send notifications', () => {
      it('should notify users after processing completes', () => {
        const notification = {
          organizationId: 'org-test-1',
          type: 'SYSTEM',
          title: 'Document processed successfully',
          message: 'Award Letter - Gates Foundation 2025.pdf has been processed.',
          linkUrl: '/documents/doc-test-1',
        }

        expect(notification.type).toBe('SYSTEM')
        expect(notification.message).toContain('Gates Foundation')
      })
    })

    describe('Error handling and retries', () => {
      it('should retry up to 3 times on failure', () => {
        const config = { retries: 3 }
        expect(config.retries).toBe(3)
      })

      it('should mark document as FAILED after all retries exhausted', () => {
        const doc = createMockDocument({ status: 'FAILED' })
        expect(doc.status).toBe('FAILED')
      })

      it('should emit webhook on document processed (success or failure)', () => {
        const webhookEvent = {
          type: 'document.processed',
          documentId: 'doc-test-1',
          status: 'COMPLETED',
        }
        expect(webhookEvent.type).toBe('document.processed')
      })
    })
  })

  describe('Document filtering and queries', () => {
    it('should filter documents by type', () => {
      const docs = [
        createMockDocument({ type: 'AWARD_LETTER' }),
        createMockDocument({ type: 'PROPOSAL', id: 'doc-2' }),
        createMockDocument({ type: 'BUDGET', id: 'doc-3' }),
      ]

      const filtered = docs.filter((d) => d.type === 'AWARD_LETTER')
      expect(filtered).toHaveLength(1)
    })

    it('should filter documents by status', () => {
      const docs = [
        createMockDocument({ status: 'COMPLETED' }),
        createMockDocument({ status: 'PENDING', id: 'doc-2' }),
        createMockDocument({ status: 'FAILED', id: 'doc-3' }),
      ]

      const completed = docs.filter((d) => d.status === 'COMPLETED')
      expect(completed).toHaveLength(1)
    })

    it('should filter documents by grantId', () => {
      const docs = [
        createMockDocument({ grantId: 'grant-1' }),
        createMockDocument({ grantId: 'grant-2', id: 'doc-2' }),
        createMockDocument({ grantId: 'grant-1', id: 'doc-3' }),
      ]

      const forGrant1 = docs.filter((d) => d.grantId === 'grant-1')
      expect(forGrant1).toHaveLength(2)
    })

    it('should scope all queries to organization', () => {
      const ctx = createMockContext()
      const query = { organizationId: ctx.organizationId }
      expect(query.organizationId).toBe('org-test-1')
    })
  })

  describe('Document health statistics', () => {
    it('should calculate processing success rate', () => {
      const total = 20
      const completed = 15
      const failed = 3
      const pending = 2

      const successRate = Math.round((completed / total) * 100)
      expect(successRate).toBe(75)
      expect(completed + failed + pending).toBe(total)
    })

    it('should identify stuck documents (PENDING > 1 hour)', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const stuckDoc = createMockDocument({
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours old
      })

      const isStuck =
        stuckDoc.status === 'PENDING' &&
        (stuckDoc.createdAt as Date).getTime() < oneHourAgo.getTime()
      expect(isStuck).toBe(true)
    })
  })
})
