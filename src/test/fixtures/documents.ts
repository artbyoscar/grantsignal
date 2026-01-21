import { Source, DocumentType } from '@/types/source'
import { RAGContext } from '@/server/services/ai/rag'

/**
 * Mock documents with various confidence levels for testing
 */
export const mockDocuments = {
  highConfidence: {
    id: 'doc-high-1',
    name: 'Previous Grant Proposal 2024.pdf',
    type: 'proposal' as DocumentType,
    parseConfidence: 95,
    content: 'Our organization has served over 5,000 youth in the past year through our after-school programs...',
  },
  mediumConfidence: {
    id: 'doc-medium-1',
    name: 'Annual Report 2023.pdf',
    type: 'report' as DocumentType,
    parseConfidence: 72,
    content: 'Key achievements include community outreach and program expansion...',
  },
  lowConfidence: {
    id: 'doc-low-1',
    name: 'Scanned Budget.pdf',
    type: 'budget' as DocumentType,
    parseConfidence: 45,
    content: 'Budget line items...',
  },
}

/**
 * Mock RAG contexts with different similarity scores
 */
export const mockRAGContexts: Record<string, RAGContext[]> = {
  // High similarity (>0.8) - should result in high confidence
  highSimilarity: [
    {
      text: 'Our after-school program serves 500 students annually with a focus on STEM education and mentorship.',
      documentId: 'doc-1',
      documentName: 'Program Overview 2024.pdf',
      chunkIndex: 0,
      score: 0.92,
    },
    {
      text: 'In 2023, we achieved a 95% program completion rate and 87% of participants reported improved academic performance.',
      documentId: 'doc-2',
      documentName: 'Impact Report 2023.pdf',
      chunkIndex: 3,
      score: 0.88,
    },
    {
      text: 'Our organization partners with 12 local schools and has trained 45 volunteer mentors.',
      documentId: 'doc-1',
      documentName: 'Program Overview 2024.pdf',
      chunkIndex: 5,
      score: 0.85,
    },
  ],

  // Medium similarity (0.7-0.79) - should result in medium confidence
  mediumSimilarity: [
    {
      text: 'Community engagement activities include workshops and family events.',
      documentId: 'doc-3',
      documentName: 'Community Engagement Plan.pdf',
      chunkIndex: 2,
      score: 0.75,
    },
    {
      text: 'Budget allocations for program materials and staff training.',
      documentId: 'doc-4',
      documentName: 'Budget 2024.pdf',
      chunkIndex: 1,
      score: 0.72,
    },
  ],

  // Low similarity (<0.7) - should be filtered out by RAG
  lowSimilarity: [
    {
      text: 'General organizational information and contact details.',
      documentId: 'doc-5',
      documentName: 'Organization Info.pdf',
      chunkIndex: 0,
      score: 0.65,
    },
  ],

  // No sources
  noSources: [],
}

/**
 * Mock Source objects for UI components
 */
export const mockSources: Record<string, Source[]> = {
  multiple: [
    {
      id: 'source-1',
      documentId: 'doc-1',
      documentName: 'Program Overview 2024.pdf',
      documentType: 'proposal',
      relevanceScore: 92,
      excerpt: 'Our after-school program serves 500 students annually with a focus on STEM education...',
      pageNumber: 1,
    },
    {
      id: 'source-2',
      documentId: 'doc-2',
      documentName: 'Impact Report 2023.pdf',
      documentType: 'report',
      relevanceScore: 88,
      excerpt: 'In 2023, we achieved a 95% program completion rate and 87% of participants...',
      pageNumber: 5,
    },
    {
      id: 'source-3',
      documentId: 'doc-3',
      documentName: 'Community Engagement Plan.pdf',
      documentType: 'other',
      relevanceScore: 85,
      excerpt: 'Our organization partners with 12 local schools and has trained 45 volunteer...',
      pageNumber: 3,
    },
  ],

  single: [
    {
      id: 'source-1',
      documentId: 'doc-1',
      documentName: 'Program Overview 2024.pdf',
      documentType: 'proposal',
      relevanceScore: 92,
      excerpt: 'Our after-school program serves 500 students annually...',
      pageNumber: 1,
    },
  ],

  lowRelevance: [
    {
      id: 'source-1',
      documentId: 'doc-5',
      documentName: 'General Info.pdf',
      documentType: 'other',
      relevanceScore: 45,
      excerpt: 'Contact information and basic organizational details...',
    },
  ],

  empty: [],
}

/**
 * Mock AI generations with varying confidence
 */
export const mockGenerations = {
  highConfidence: {
    content: 'Our comprehensive after-school program has demonstrated exceptional impact, serving 500 students annually with a 95% completion rate. Based on our 2023 Impact Report, 87% of participants showed improved academic performance.',
    sources: mockSources.multiple,
    confidence: 'high' as const,
    confidenceScore: 89,
    tokensUsed: 450,
    model: 'claude-sonnet-4-5-20250929',
  },

  mediumConfidence: {
    content: 'Our organization runs community engagement programs including workshops and educational activities. We work to support local families through various initiatives.',
    sources: mockSources.multiple.slice(0, 2),
    confidence: 'medium' as const,
    confidenceScore: 68,
    tokensUsed: 320,
    model: 'claude-sonnet-4-5-20250929',
  },

  lowConfidence: {
    content: '',
    sources: mockSources.lowRelevance,
    confidence: 'low' as const,
    confidenceScore: 42,
    tokensUsed: 150,
    model: 'claude-sonnet-4-5-20250929',
  },
}
