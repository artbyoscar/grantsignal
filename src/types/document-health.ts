import { DocumentType, ProcessingStatus } from '@prisma/client'

export type HealthStatus = 'successful' | 'needs-review' | 'failed'

export interface DocumentHealthStats {
  total: number
  successful: number
  needsReview: number
  failed: number
  processing: number
  healthScore: number
}

export interface DocumentIssue {
  type: 'extraction' | 'parsing' | 'validation' | 'quality'
  severity: 'low' | 'medium' | 'high'
  message: string
  pageNumbers?: number[]
}

export interface DocumentHealthItem {
  id: string
  name: string
  type: DocumentType
  status: ProcessingStatus
  confidenceScore: number | null
  createdAt: Date
  processedAt: Date | null
  mimeType: string | null
  size: number
  issues: DocumentIssue[]
  grant?: {
    id: string
    funder: {
      name: string
    } | null
  } | null
  extractedText?: string | null
  metadata?: any
  parseWarnings?: any
}

export interface DocumentReviewData {
  document: DocumentHealthItem
  originalUrl?: string
  editableFields: {
    extractedText?: string
    metadata?: Record<string, any>
  }
}

export type HealthFilter = 'all' | 'successful' | 'needs-review' | 'failed'
