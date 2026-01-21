import { vi } from 'vitest'

export const mockPineconeQuery = vi.fn()
export const mockNamespace = vi.fn(() => ({
  query: mockPineconeQuery,
}))
export const mockGetIndex = vi.fn(() => ({
  namespace: mockNamespace,
}))

// Default mock responses
export const defaultPineconeResponse = {
  matches: [
    {
      id: 'chunk-1',
      score: 0.92,
      metadata: {
        documentId: 'doc-1',
        documentName: 'Doc 1',
        text: 'High relevance',
        chunkIndex: 0,
      },
    },
    {
      id: 'chunk-2',
      score: 0.75,
      metadata: {
        documentId: 'doc-2',
        documentName: 'Doc 2',
        text: 'Medium relevance',
        chunkIndex: 0,
      },
    },
  ],
}

export function resetPineconeMocks() {
  mockPineconeQuery.mockReset()
  mockNamespace.mockReset()
  mockGetIndex.mockReset()

  mockPineconeQuery.mockResolvedValue(defaultPineconeResponse)
  mockNamespace.mockReturnValue({ query: mockPineconeQuery })
  mockGetIndex.mockReturnValue({ namespace: mockNamespace })
}

// Setup mock
vi.mock('@/lib/pinecone', () => ({
  getIndex: mockGetIndex,
  isPineconeConfigured: () => true,
}))
