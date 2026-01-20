export interface Chunk {
  text: string
  index: number
  startChar: number
  endChar: number
}

export interface ChunkOptions {
  chunkSize?: number    // Target size in characters (default 2000 ~512 tokens)
  overlap?: number      // Overlap in characters (default 200 ~50 tokens)
}

const DEFAULT_CHUNK_SIZE = 2000 // ~512 tokens
const DEFAULT_OVERLAP = 200     // ~50 tokens

/**
 * Split text into overlapping chunks while preserving paragraph boundaries
 * @param text - Text to chunk
 * @param options - Chunking options
 * @returns Array of chunks with metadata
 */
export function chunkText(
  text: string,
  options?: ChunkOptions
): Chunk[] {
  const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE
  const overlap = options?.overlap || DEFAULT_OVERLAP

  if (!text || text.trim().length === 0) {
    return []
  }

  // Normalize whitespace and split into paragraphs
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const paragraphs = normalizedText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0)

  const chunks: Chunk[] = []
  let currentChunk = ''
  let currentStartChar = 0
  let globalCharCount = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]

    // If adding this paragraph would exceed chunk size, save current chunk
    if (currentChunk.length > 0 && currentChunk.length + paragraph.length + 2 > chunkSize) {
      // Save the current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunks.length,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      })

      // Start new chunk with overlap from previous chunk
      const overlapText = getOverlapText(currentChunk, overlap)
      currentChunk = overlapText ? overlapText + '\n\n' + paragraph : paragraph
      currentStartChar = currentStartChar + currentChunk.length - overlapText.length - 2
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph
    }

    // If this is the last paragraph, save the chunk
    if (i === paragraphs.length - 1 && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunks.length,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      })
    }

    globalCharCount += paragraph.length + 2 // +2 for \n\n
  }

  // Handle edge case: very long text with no paragraph breaks
  if (chunks.length === 0 && normalizedText.length > 0) {
    return chunkTextBySize(normalizedText, chunkSize, overlap)
  }

  return chunks
}

/**
 * Get overlap text from end of previous chunk
 * Tries to get complete sentences when possible
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) {
    return text
  }

  // Get the last `overlapSize` characters
  const overlapText = text.slice(-overlapSize)

  // Try to find the last sentence boundary
  const sentenceEnd = overlapText.lastIndexOf('. ')
  if (sentenceEnd > overlapSize / 2) {
    return overlapText.slice(sentenceEnd + 2) // +2 to skip '. '
  }

  // If no sentence boundary, return the overlap as is
  return overlapText
}

/**
 * Fallback chunking strategy for text without paragraph breaks
 * Splits on sentence boundaries when possible
 */
function chunkTextBySize(
  text: string,
  chunkSize: number,
  overlap: number
): Chunk[] {
  const chunks: Chunk[] = []
  let position = 0

  while (position < text.length) {
    const end = Math.min(position + chunkSize, text.length)
    let chunkEnd = end

    // Try to find a sentence boundary near the end
    if (end < text.length) {
      const substring = text.slice(position, end + 100) // Look ahead a bit
      const sentenceEnd = substring.lastIndexOf('. ')
      if (sentenceEnd > chunkSize - 200) { // Within 200 chars of target
        chunkEnd = position + sentenceEnd + 1
      }
    }

    const chunkText = text.slice(position, chunkEnd).trim()

    chunks.push({
      text: chunkText,
      index: chunks.length,
      startChar: position,
      endChar: chunkEnd,
    })

    // Move position forward, accounting for overlap
    position = chunkEnd - overlap
  }

  return chunks
}