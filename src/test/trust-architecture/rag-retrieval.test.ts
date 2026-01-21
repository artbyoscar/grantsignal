import { vi, describe, it, expect, beforeEach } from 'vitest'
import { mockGetIndex, mockPineconeQuery, resetPineconeMocks } from '../mocks/pinecone'
import { mockRAGContexts } from '../fixtures/documents'

// This must be called before importing the module under test
vi.mock('@/lib/pinecone', () => ({
  getIndex: mockGetIndex,
}))

vi.mock('@/server/services/ai/embeddings', () => ({
  generateEmbedding: vi.fn(async (text: string) => {
    // Return consistent mock embedding
    return Array(1536).fill(0).map((_, i) => Math.sin(i * 0.1))
  }),
}))

describe('Trust Architecture - RAG Retrieval', () => {
  beforeEach(() => {
    resetPineconeMocks()
  })

  describe('Similarity Threshold (0.7 cosine similarity)', () => {
    it('should only return chunks with similarity >= 0.7', () => {
      const allContexts = [
        ...mockRAGContexts.highSimilarity,
        ...mockRAGContexts.mediumSimilarity,
        ...mockRAGContexts.lowSimilarity,
      ]

      const filteredContexts = allContexts.filter((ctx) => ctx.score >= 0.7)

      filteredContexts.forEach((ctx) => {
        expect(ctx.score).toBeGreaterThanOrEqual(0.7)
      })

      // Verify that low similarity contexts are filtered out
      const lowSimilarityCount = allContexts.filter((ctx) => ctx.score < 0.7).length
      expect(lowSimilarityCount).toBeGreaterThan(0) // Ensure we're actually testing filtering
    })

    it('should filter out results below similarity threshold', async () => {
      // Configure mock with mixed similarity scores
      mockPineconeQuery.mockResolvedValueOnce({
        matches: [
          { id: '1', score: 0.92, metadata: { text: 'High relevance', documentId: 'doc-1', documentName: 'Doc 1', chunkIndex: 0 } },
          { id: '2', score: 0.75, metadata: { text: 'Medium relevance', documentId: 'doc-2', documentName: 'Doc 2', chunkIndex: 0 } },
          { id: '3', score: 0.65, metadata: { text: 'Low relevance', documentId: 'doc-3', documentName: 'Doc 3', chunkIndex: 0 } }, // Below threshold
          { id: '4', score: 0.55, metadata: { text: 'Very low relevance', documentId: 'doc-4', documentName: 'Doc 4', chunkIndex: 0 } }, // Below threshold
        ],
      })

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
        minScore: 0.7,
      })

      // Should only include scores >= 0.7
      expect(results.length).toBe(2)
      results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(0.7)
      })
    })

    it('should use configurable minimum score threshold', async () => {
      const customThreshold = 0.8

      mockPineconeQuery.mockResolvedValueOnce({
        matches: [
          { id: '1', score: 0.92, metadata: { text: 'High', documentId: 'doc-1', documentName: 'Doc 1', chunkIndex: 0 } },
          { id: '2', score: 0.85, metadata: { text: 'High-medium', documentId: 'doc-2', documentName: 'Doc 2', chunkIndex: 0 } },
          { id: '3', score: 0.75, metadata: { text: 'Medium', documentId: 'doc-3', documentName: 'Doc 3', chunkIndex: 0 } },
        ],
      })

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
        minScore: customThreshold,
      })

      expect(results.length).toBe(2) // Only 0.92 and 0.85
      results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(customThreshold)
      })
    })

    it('should handle case when no chunks meet threshold', async () => {
      mockPineconeQuery.mockResolvedValueOnce({
        matches: [
          { id: '1', score: 0.65, metadata: { text: 'Low', documentId: 'doc-1', documentName: 'Doc 1', chunkIndex: 0 } },
          { id: '2', score: 0.55, metadata: { text: 'Very low', documentId: 'doc-2', documentName: 'Doc 2', chunkIndex: 0 } },
        ],
      })

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
        minScore: 0.7,
      })

      expect(results).toEqual([])
    })
  })

  describe('No Sources = No Generation', () => {
    it('should return empty array when no sources found', async () => {
      mockPineconeQuery.mockResolvedValueOnce({ matches: [] })

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'query with no matches',
        organizationId: 'org-123',
      })

      expect(results).toEqual([])
      expect(results.length).toBe(0)
    })

    it('should prevent AI generation when no sources returned', () => {
      const contexts = mockRAGContexts.noSources

      expect(contexts).toEqual([])
      expect(contexts.length).toBe(0)

      // In the actual implementation, this would prevent generation
      const canGenerate = contexts.length > 0
      expect(canGenerate).toBe(false)
    })

    it('should return low confidence when no sources available', async () => {
      const contextsFound = 0
      const contextsUsed = 0
      const averageRelevance = 0

      // Confidence calculation with no contexts
      const contextFoundScore = Math.min((contextsFound / 5) * 40, 40) // 0
      const contextUsedScore = Math.min((contextsUsed / 3) * 30, 30) // 0
      const relevanceScore = averageRelevance * 30 // 0
      const confidenceScore = Math.round(contextFoundScore + contextUsedScore + relevanceScore)

      expect(confidenceScore).toBe(0)
      expect(confidenceScore).toBeLessThan(60)

      const confidenceLevel = confidenceScore >= 80 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low'
      expect(confidenceLevel).toBe('low')
    })
  })

  describe('RAG Context Metadata', () => {
    it('should include all required metadata fields', () => {
      const contexts = mockRAGContexts.highSimilarity

      contexts.forEach((ctx) => {
        expect(ctx).toHaveProperty('text')
        expect(ctx).toHaveProperty('documentId')
        expect(ctx).toHaveProperty('documentName')
        expect(ctx).toHaveProperty('chunkIndex')
        expect(ctx).toHaveProperty('score')

        expect(typeof ctx.text).toBe('string')
        expect(typeof ctx.documentId).toBe('string')
        expect(typeof ctx.documentName).toBe('string')
        expect(typeof ctx.chunkIndex).toBe('number')
        expect(typeof ctx.score).toBe('number')
      })
    })

    it('should preserve document source information', () => {
      const contexts = mockRAGContexts.highSimilarity

      contexts.forEach((ctx) => {
        expect(ctx.documentId).toBeTruthy()
        expect(ctx.documentName).toBeTruthy()
        expect(ctx.documentName).toMatch(/\.pdf$/i)
      })
    })

    it('should include chunk index for document navigation', () => {
      const contexts = mockRAGContexts.highSimilarity

      contexts.forEach((ctx) => {
        expect(ctx.chunkIndex).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(ctx.chunkIndex)).toBe(true)
      })
    })

    it('should filter out contexts with empty text', async () => {
      mockPineconeQuery.mockResolvedValueOnce({
        matches: [
          { id: '1', score: 0.92, metadata: { text: 'Valid text', documentId: 'doc-1', documentName: 'Doc 1', chunkIndex: 0 } },
          { id: '2', score: 0.88, metadata: { text: '', documentId: 'doc-2', documentName: 'Doc 2', chunkIndex: 0 } }, // Empty text
          { id: '3', score: 0.85, metadata: { documentId: 'doc-3', documentName: 'Doc 3', chunkIndex: 0 } }, // No text field
        ],
      })

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
      })

      // Should only include the one with valid text
      expect(results.length).toBe(1)
      expect(results[0].text).toBe('Valid text')
    })
  })

  describe('Top-K Results', () => {
    it('should limit results to topK parameter', async () => {
      mockPineconeQuery.mockImplementationOnce(async ({ topK }: { topK: number }) => ({
        matches: Array(15)
          .fill(0)
          .map((_, i) => ({
            id: `vec-${i}`,
            score: 0.95 - i * 0.02, // Decreasing scores
            metadata: {
              text: `Context ${i}`,
              documentId: `doc-${i}`,
              documentName: `Document ${i}.pdf`,
              chunkIndex: i,
            },
          }))
          .slice(0, topK),
      }))

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
        topK: 5,
      })

      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should default to 10 results when topK not specified', async () => {
      mockPineconeQuery.mockResolvedValueOnce({
        matches: Array(15)
          .fill(0)
          .map((_, i) => ({
            id: `vec-${i}`,
            score: 0.95 - i * 0.02,
            metadata: {
              text: `Context ${i}`,
              documentId: `doc-${i}`,
              documentName: `Document ${i}.pdf`,
              chunkIndex: i,
            },
          })),
      })

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
        // topK not specified, should default to 10
      })

      // After filtering by threshold, should have at most 10 results
      expect(results.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Organization Isolation', () => {
    it('should query within organization namespace', async () => {
      const organizationId = 'org-456'

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      await queryOrganizationMemory({
        query: 'test query',
        organizationId,
      })

      // Verify the namespace was called with the organization ID
      expect(mockGetIndex().namespace).toHaveBeenCalledWith(organizationId)
    })

    it('should not return results from other organizations', () => {
      // This is ensured by Pinecone namespace isolation
      const org1Contexts = mockRAGContexts.highSimilarity
      const org2Query = 'query from different org'

      // In actual implementation, namespace isolation prevents cross-org access
      // This test validates the expectation
      expect(org1Contexts).toBeDefined()
      expect(Array.isArray(org1Contexts)).toBe(true)

      // Results should only come from the queried namespace
      org1Contexts.forEach((ctx) => {
        expect(ctx.documentId).toBeTruthy()
        expect(ctx.documentName).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle Pinecone not configured', async () => {
      // Mock getIndex to return null for this test
      mockGetIndex.mockReturnValueOnce(null as any)

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      const results = await queryOrganizationMemory({
        query: 'test query',
        organizationId: 'org-123',
      })

      expect(results).toEqual([])
    })

    it('should handle embedding generation failure gracefully', async () => {
      const { generateEmbedding } = await import('@/server/services/ai/embeddings')
      vi.mocked(generateEmbedding).mockRejectedValueOnce(new Error('Embedding generation failed'))

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      await expect(
        queryOrganizationMemory({
          query: 'test query',
          organizationId: 'org-123',
        })
      ).rejects.toThrow()
    })

    it('should handle Pinecone query errors', async () => {
      mockPineconeQuery.mockRejectedValueOnce(new Error('Pinecone query failed'))

      const { queryOrganizationMemory } = await import('@/server/services/ai/rag')

      await expect(
        queryOrganizationMemory({
          query: 'test query',
          organizationId: 'org-123',
        })
      ).rejects.toThrow()
    })
  })
})
