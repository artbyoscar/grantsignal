import mammoth from 'mammoth'
import { confidenceScoring } from '../ai/confidence-scoring'
import type { ParsedDocumentMetadata, ParseConfidenceResult } from '@/types/confidence'

export interface ParseResult {
  text: string
  confidence: number // 0-100
  warnings: string[]
  metadata: {
    pageCount?: number
    wordCount: number
    detectedType?: string
    hasStructuredData?: boolean
    extractedDates?: Date[]
    extractedEntities?: {
      amounts?: string[]
      names?: string[]
      organizations?: string[]
    }
  }
  confidenceDetails?: ParseConfidenceResult // Detailed confidence breakdown
}

/**
 * Parse document and extract text with confidence scoring
 * @param useAdvancedScoring - Use new confidence scoring service (default: true)
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  useAdvancedScoring = true
): Promise<ParseResult> {
  try {
    // Route to appropriate parser based on MIME type
    let result: ParseResult;

    if (mimeType === 'application/pdf') {
      result = await parsePDF(buffer)
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      result = await parseDOCX(buffer)
    } else if (mimeType === 'text/plain') {
      result = await parseTXT(buffer)
    } else {
      throw new Error(`Unsupported MIME type: ${mimeType}`)
    }

    // Apply advanced confidence scoring if enabled
    if (useAdvancedScoring) {
      result = enhanceWithConfidenceScoring(result)
    }

    return result
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
    // Dynamic import to avoid loading pdf-parse at build time
    const pdfParseModule = await import('pdf-parse') as any
    const pdfParse = pdfParseModule.default || pdfParseModule
    const data = await pdfParse(buffer)
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

/**
 * Extract dates from text using regex patterns
 */
function extractDates(text: string): Date[] {
  const dates: Date[] = []

  // Common date patterns
  const patterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g, // MM/DD/YYYY or DD-MM-YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, // Month DD, YYYY
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi, // DD Month YYYY
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g, // YYYY-MM-DD
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      try {
        const dateStr = match[0]
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) {
          dates.push(parsed)
        }
      } catch {
        // Skip invalid dates
      }
    }
  }

  return dates
}

/**
 * Extract monetary amounts from text
 */
function extractAmounts(text: string): string[] {
  const amounts: string[] = []

  // Patterns for dollar amounts
  const patterns = [
    /\$[\d,]+(?:\.\d{2})?/g, // $1,234.56
    /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)\b/gi, // 1,234.56 dollars
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      amounts.push(match[0])
    }
  }

  return [...new Set(amounts)] // Remove duplicates
}

/**
 * Extract person names (basic heuristic)
 */
function extractNames(text: string): string[] {
  const names: string[] = []

  // Look for capitalized words that might be names (2-3 word sequences)
  const pattern = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g
  const matches = text.matchAll(pattern)

  for (const match of matches) {
    const fullName = match[0]
    // Filter out common false positives
    if (!fullName.match(/^(The|For|And|But|Not|With|From|Into|Upon|About)\s/)) {
      names.push(fullName)
    }
  }

  return [...new Set(names)].slice(0, 10) // Limit to 10 unique names
}

/**
 * Extract organization names (basic heuristic)
 */
function extractOrganizations(text: string): string[] {
  const orgs: string[] = []

  // Look for words followed by common org suffixes
  const patterns = [
    /\b([A-Z][A-Za-z\s&]+)\s+(Inc\.?|LLC|Corp\.?|Corporation|Foundation|Institute|University|College|Company|Association)\b/g,
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      orgs.push(match[0])
    }
  }

  return [...new Set(orgs)].slice(0, 10) // Limit to 10 unique orgs
}

/**
 * Check if text has structured data (tables, lists, etc.)
 */
function hasStructuredData(text: string): boolean {
  // Look for patterns that suggest tables or structured lists
  const structureIndicators = [
    /\|\s*[^\n]+\s*\|/g, // Table with pipes
    /^\s*[\d\-\*\+]\.\s+/gm, // Numbered or bulleted lists
    /\t{2,}/g, // Multiple tabs (table columns)
    /^[\-=]{3,}$/gm, // Horizontal rules
  ]

  return structureIndicators.some(pattern => pattern.test(text))
}

/**
 * Enhance parse result with advanced confidence scoring
 */
function enhanceWithConfidenceScoring(result: ParseResult): ParseResult {
  const { text, metadata } = result

  // Extract additional metadata for confidence scoring
  const extractedDates = extractDates(text)
  const extractedAmounts = extractAmounts(text)
  const extractedNames = extractNames(text)
  const extractedOrgs = extractOrganizations(text)
  const hasStructured = hasStructuredData(text)

  // Build metadata for confidence scoring
  const docMetadata: ParsedDocumentMetadata = {
    text,
    wordCount: metadata.wordCount,
    pageCount: metadata.pageCount,
    detectedType: metadata.detectedType as any,
    hasStructuredData: hasStructured,
    extractedDates: extractedDates.length > 0 ? extractedDates : undefined,
    extractedEntities: {
      amounts: extractedAmounts.length > 0 ? extractedAmounts : undefined,
      names: extractedNames.length > 0 ? extractedNames : undefined,
      organizations: extractedOrgs.length > 0 ? extractedOrgs : undefined,
    },
  }

  // Calculate advanced confidence
  const confidenceResult = confidenceScoring.calculateParseConfidence(docMetadata)

  // Merge warnings
  const allWarnings = [...result.warnings, ...confidenceResult.warnings]

  // Update result with enhanced data
  return {
    ...result,
    confidence: confidenceResult.score,
    warnings: [...new Set(allWarnings)], // Remove duplicates
    metadata: {
      ...metadata,
      hasStructuredData: hasStructured,
      extractedDates: extractedDates.length > 0 ? extractedDates : undefined,
      extractedEntities: {
        amounts: extractedAmounts.length > 0 ? extractedAmounts : undefined,
        names: extractedNames.length > 0 ? extractedNames : undefined,
        organizations: extractedOrgs.length > 0 ? extractedOrgs : undefined,
      },
    },
    confidenceDetails: confidenceResult,
  }
}