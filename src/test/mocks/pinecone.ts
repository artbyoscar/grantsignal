import { vi } from 'vitest'
import { mockRAGContexts } from '../fixtures/documents'

/**
 * Mock Pinecone index for testing RAG retrieval
 */
export const createMockPineconeIndex = (scenario: keyof typeof mockRAGContexts = 'highSimilarity') => {
  return {
    namespace: vi.fn(() => ({
      query: vi.fn(async ({ vector, topK, includeMetadata }) => {
        const contexts = mockRAGContexts[scenario]

        return {
          matches: contexts.map((ctx, idx) => ({
            id: `vec-${idx}`,
            score: ctx.score,
            metadata: {
              text: ctx.text,
              documentId: ctx.documentId,
              documentName: ctx.documentName,
              chunkIndex: ctx.chunkIndex,
            },
          })),
          namespace: 'test-org',
        }
      }),
      deleteMany: vi.fn(async () => ({})),
    })),
  }
}

/**
 * Mock embedding generation
 */
export const mockGenerateEmbedding = vi.fn(async (text: string) => {
  // Return a mock 1536-dimensional embedding (OpenAI ada-002 size)
  return Array(1536).fill(0).map(() => Math.random())
})

/**
 * Mock Pinecone configuration
 */
export const mockPineconeConfig = {
  isPineconeConfigured: vi.fn(() => true),
  getIndex: vi.fn(() => createMockPineconeIndex()),
}
