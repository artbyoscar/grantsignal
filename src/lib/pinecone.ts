import { Pinecone } from '@pinecone-database/pinecone'

let pineconeInstance: Pinecone | null = null

/**
 * Get or create a Pinecone client instance
 * Throws an error if PINECONE_API_KEY is not set
 */
export function getPinecone(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set in environment variables')
  }

  if (!pineconeInstance) {
    pineconeInstance = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
  }

  return pineconeInstance
}

/**
 * Get Pinecone index for document storage
 * Returns null if Pinecone is not configured (dev mode)
 */
export function getIndex() {
  try {
    const pinecone = getPinecone()

    if (!process.env.PINECONE_INDEX) {
      throw new Error('PINECONE_INDEX is not set in environment variables')
    }

    return pinecone.index(process.env.PINECONE_INDEX)
  } catch (error) {
    console.warn('Pinecone not configured:', error)
    return null
  }
}

/**
 * Check if Pinecone is configured
 */
export function isPineconeConfigured(): boolean {
  return !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX)
}