import OpenAI from 'openai'
import { getIndex } from '@/lib/pinecone'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/**
 * Memory search result interface
 */
export interface MemoryResult {
  documentId: string
  chunkText: string
  relevanceScore: number
  metadata: {
    sourceTitle: string
    documentType: string
  }
}

/**
 * Generate embedding for query text using OpenAI's text-embedding-3-small model
 * @param text - Query text to generate embedding for
 * @returns Embedding vector (1536 dimensions for text-embedding-3-small)
 */
async function generateQueryEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Failed to generate query embedding:', error)
    throw new Error(`OpenAI embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search organizational memory in Pinecone vector database
 * @param params - Search parameters
 * @param params.query - Search query text
 * @param params.orgId - Organization ID for namespace filtering
 * @param params.limit - Maximum number of results to return (default: 5)
 * @returns Array of memory results with relevance scores
 */
export async function searchOrganizationalMemory({
  query,
  orgId,
  limit = 5,
}: {
  query: string
  orgId: string
  limit?: number
}): Promise<MemoryResult[]> {
  try {
    // Get Pinecone index
    const index = getIndex()
    if (!index) {
      console.warn('Pinecone is not configured, returning empty results')
      return []
    }

    // Generate embedding for the query
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateQueryEmbedding(query)
    } catch (error) {
      console.warn('Failed to generate embedding, returning empty results:', error)
      return []
    }

    // Query Pinecone with organization namespace
    const namespace = index.namespace(orgId)
    const queryResponse = await namespace.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
    })

    // Transform results to MemoryResult format
    const results = (queryResponse.matches || [])
      .map(match => formatMemoryResult(match))
      .filter((result): result is MemoryResult => result !== null)

    return results
  } catch (error) {
    console.warn('Pinecone query failed, returning empty results:', error)
    return []
  }
}

/**
 * Transform Pinecone query result to MemoryResult format
 * @param pineconeResult - Raw result from Pinecone query
 * @returns Formatted MemoryResult or null if invalid
 */
export function formatMemoryResult(pineconeResult: {
  id: string
  score?: number
  metadata?: Record<string, unknown>
}): MemoryResult | null {
  try {
    const { metadata, score } = pineconeResult

    if (!metadata) {
      return null
    }

    // Extract metadata fields
    const documentId = metadata.documentId as string | undefined
    const text = metadata.text as string | undefined
    const documentName = metadata.documentName as string | undefined
    const documentType = metadata.documentType as string | undefined

    // Validate required fields
    if (!documentId || !text) {
      return null
    }

    // Truncate excerpt to ~200 characters
    const truncatedText = text.length > 200
      ? text.substring(0, 200).trim() + '...'
      : text

    // Convert score to 0-100 percentage
    const relevanceScore = Math.round((score ?? 0) * 100)

    return {
      documentId,
      chunkText: truncatedText,
      relevanceScore,
      metadata: {
        sourceTitle: documentName || 'Untitled Document',
        documentType: documentType || 'unknown',
      },
    }
  } catch (error) {
    console.error('Failed to format memory result:', error)
    return null
  }
}
