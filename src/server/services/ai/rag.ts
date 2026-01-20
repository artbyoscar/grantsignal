import { getIndex, isPineconeConfigured } from '@/lib/pinecone'
import { generateEmbedding } from './embeddings'

export interface RAGContext {
  text: string
  documentId: string
  documentName: string
  chunkIndex: number
  score: number
}

export interface QueryOrganizationMemoryOptions {
  query: string
  organizationId: string
  topK?: number         // Number of results to return (default 10)
  minScore?: number     // Minimum similarity score (default 0.7)
}

/**
 * Query organization's document memory using semantic search
 * @param options - Query options
 * @returns Array of relevant contexts with source attribution
 */
export async function queryOrganizationMemory(
  options: QueryOrganizationMemoryOptions
): Promise<RAGContext[]> {
  const { query, organizationId, topK = 10, minScore = 0.7 } = options

  // Check if Pinecone is configured
  if (!isPineconeConfigured()) {
    console.warn('Pinecone not configured. Returning empty results. Set PINECONE_API_KEY and PINECONE_INDEX to enable RAG.')
    return []
  }

  const index = getIndex()
  if (!index) {
    console.warn('Failed to get Pinecone index. Returning empty results.')
    return []
  }

  try {
    // Generate embedding for the query
    console.log(`Generating embedding for query: "${query.slice(0, 50)}..."`)
    const queryEmbedding = await generateEmbedding(query)

    // Query Pinecone with namespace filtering by organizationId
    console.log(`Querying Pinecone for organization: ${organizationId}`)
    const queryResponse = await index.namespace(organizationId).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    })

    // Filter and format results
    const contexts: RAGContext[] = queryResponse.matches
      .filter(match => match.score && match.score >= minScore)
      .map(match => ({
        text: (match.metadata?.text as string) || '',
        documentId: (match.metadata?.documentId as string) || '',
        documentName: (match.metadata?.documentName as string) || 'Unknown',
        chunkIndex: (match.metadata?.chunkIndex as number) || 0,
        score: match.score || 0,
      }))
      .filter(context => context.text.length > 0) // Ensure we have valid text

    console.log(`Found ${contexts.length} relevant chunks (min score: ${minScore})`)

    return contexts
  } catch (error) {
    console.error('Error querying organization memory:', error)
    throw new Error(`Failed to query organization memory: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete all vectors for a document from Pinecone
 * Used when a document is deleted from the database
 */
export async function deleteDocumentVectors(
  documentId: string,
  organizationId: string
): Promise<void> {
  if (!isPineconeConfigured()) {
    console.warn('Pinecone not configured. Skipping vector deletion.')
    return
  }

  const index = getIndex()
  if (!index) {
    console.warn('Failed to get Pinecone index. Skipping vector deletion.')
    return
  }

  try {
    // Delete all vectors with this document ID
    // Note: This requires fetching vector IDs first, then deleting
    console.log(`Deleting vectors for document: ${documentId}`)

    // We can't directly query by metadata, so we'll use a filter if supported
    // For now, we'll assume vector IDs follow the pattern: `${documentId}-${chunkIndex}`
    // and delete them in a batch

    // Get all vector IDs for this document (you might need to store these in DB)
    // For simplicity, we'll delete by filter if Pinecone supports it
    await index.namespace(organizationId).deleteMany({
      documentId: { $eq: documentId }
    })

    console.log(`Successfully deleted vectors for document: ${documentId}`)
  } catch (error) {
    console.error('Error deleting document vectors:', error)
    // Don't throw - we want to continue even if vector deletion fails
  }
}