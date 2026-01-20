import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export interface ParseResult {
  text: string
  confidence: number // 0-100
  warnings: string[]
  metadata: {
    pageCount?: number
    wordCount: number
    detectedType?: string
  }
}

/**
 * Parse document and extract text with confidence scoring
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult> {
  try {
    // Route to appropriate parser based on MIME type
    if (mimeType === 'application/pdf') {
      return await parsePDF(buffer)
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return await parseDOCX(buffer)
    } else if (mimeType === 'text/plain') {
      return await parseTXT(buffer)
    } else {
      throw new Error(`Unsupported MIME type: ${mimeType}`)
    }
  } catch (error) {
    console.error('Document parsing error:', error)
    throw error
  }
}

/**
 * Parse PDF documents using pdf-parse
 * Falls back to low confidence for scanned PDFs
 */
async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  const warnings: string[] = []

  try {
    const data = await pdf(buffer)
    const text = data.text.trim()
    const pageCount = data.numpages
    const wordCount = countWords(text)

    // Check if text extraction was successful
    if (text.length < 100) {
      warnings.push(
        'Very little text extracted. This may be a scanned PDF that requires OCR.'
      )
      return {
        text,
        confidence: 30, // Low confidence for scanned documents
        warnings,
        metadata: {
          pageCount,
          wordCount,
          detectedType: 'pdf-scanned',
        },
      }
    }

    // Calculate confidence based on text quality
    const confidence = calculateTextConfidence(text, wordCount)

    if (confidence < 70) {
      warnings.push(
        'Text extraction confidence is below threshold. Manual review recommended.'
      )
    }

    return {
      text,
      confidence,
      warnings,
      metadata: {
        pageCount,
        wordCount,
        detectedType: 'pdf-text',
      },
    }
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse DOCX documents using mammoth
 */
async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  const warnings: string[] = []

  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()
    const wordCount = countWords(text)

    // Check for mammoth warnings
    if (result.messages.length > 0) {
      const warningMessages = result.messages
        .filter(m => m.type === 'warning')
        .map(m => m.message)

      if (warningMessages.length > 0) {
        warnings.push(...warningMessages)
      }
    }

    // DOCX extraction is generally reliable
    const confidence = calculateTextConfidence(text, wordCount)

    if (confidence < 70) {
      warnings.push(
        'Document appears to have minimal content. Manual review recommended.'
      )
    }

    return {
      text,
      confidence,
      warnings,
      metadata: {
        wordCount,
        detectedType: 'docx',
      },
    }
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse plain text documents
 */
async function parseTXT(buffer: Buffer): Promise<ParseResult> {
  const warnings: string[] = []

  try {
    const text = buffer.toString('utf-8').trim()
    const wordCount = countWords(text)

    // Text files should have high confidence unless empty
    const confidence = text.length > 0 ? 95 : 0

    if (text.length === 0) {
      warnings.push('Document is empty.')
    } else if (wordCount < 50) {
      warnings.push('Document has very few words. Manual review recommended.')
    }

    return {
      text,
      confidence,
      warnings,
      metadata: {
        wordCount,
        detectedType: 'text',
      },
    }
  } catch (error) {
    throw new Error(`Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate text confidence based on content quality
 */
function calculateTextConfidence(text: string, wordCount: number): number {
  let confidence = 100

  // Penalty for very short text
  if (text.length < 100) {
    confidence -= 50
  } else if (text.length < 500) {
    confidence -= 20
  }

  // Penalty for low word count
  if (wordCount < 50) {
    confidence -= 30
  } else if (wordCount < 200) {
    confidence -= 10
  }

  // Check for gibberish - count ratio of alphanumeric to total characters
  const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length
  const alphanumericRatio = alphanumericCount / text.length

  if (alphanumericRatio < 0.5) {
    confidence -= 40 // Lots of special characters or gibberish
  } else if (alphanumericRatio < 0.7) {
    confidence -= 20
  }

  // Ensure confidence stays within bounds
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0
  return text.trim().split(/\s+/).length
}