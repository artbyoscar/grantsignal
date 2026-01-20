import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embedding for a single text using OpenAI's text-embedding-3-large model
 * @param text - Text to generate embedding for
 * @returns Embedding vector (3072 dimensions for text-embedding-3-large)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate embeddings for multiple texts in batches
 * Processes in chunks of 100 to avoid rate limits
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 100
  const embeddings: number[][] = []

  try {
    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)

      console.log(`Processing embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`)

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: batch,
      })

      // Extract embeddings in order
      const batchEmbeddings = response.data.map(item => item.embedding)
      embeddings.push(...batchEmbeddings)

      // Add small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return embeddings
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}