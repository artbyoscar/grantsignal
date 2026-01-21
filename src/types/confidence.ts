/**
 * Confidence scoring types for RAG retrieval and AI generation
 */

/**
 * Confidence level categories
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Document parse confidence components
 */
export interface ParseConfidenceComponents {
  textCompleteness: number; // 0-100, weight: 40%
  structurePreservation: number; // 0-100, weight: 20%
  dateExtraction: number; // 0-100, weight: 25%
  entityExtraction: number; // 0-100, weight: 15%
}

/**
 * Document parse confidence result
 */
export interface ParseConfidenceResult {
  score: number; // 0-100
  level: ConfidenceLevel;
  components: ParseConfidenceComponents;
  warnings: string[];
  message: string;
}

/**
 * RAG retrieval confidence components
 */
export interface RetrievalConfidenceComponents {
  similarityScore: number; // 0-100, weight: 50%
  chunkQuantity: number; // 0-100, weight: 20%
  documentRecency: number; // 0-100, weight: 15%
  sourceParseQuality: number; // 0-100, weight: 15%
}

/**
 * RAG retrieval confidence result
 */
export interface RetrievalConfidenceResult {
  score: number; // 0-100
  level: ConfidenceLevel;
  components: RetrievalConfidenceComponents;
  warnings: string[];
  message: string;
  shouldAllowGeneration: boolean;
}

/**
 * Generation confidence components
 */
export interface GenerationConfidenceComponents {
  sourceRelevance: number; // 0-100, weight: 40%
  queryCoverage: number; // 0-100, weight: 30%
  factVerification: number; // 0-100, weight: 30%
}

/**
 * Generation confidence result
 */
export interface GenerationConfidenceResult {
  score: number; // 0-100
  level: ConfidenceLevel;
  components: GenerationConfidenceComponents;
  warnings: string[];
  message: string;
  shouldDisplay: boolean;
}

/**
 * Source document metadata for confidence calculation
 */
export interface SourceDocument {
  documentId: string;
  documentName: string;
  text: string;
  score: number; // Pinecone similarity score (0-1)
  chunkIndex: number;
  parseConfidence?: number; // 0-100
  createdAt?: Date;
}

/**
 * Parsed document metadata for confidence calculation
 */
export interface ParsedDocumentMetadata {
  text: string;
  wordCount: number;
  pageCount?: number;
  detectedType?: 'pdf-text' | 'pdf-scanned' | 'docx' | 'text';
  hasStructuredData?: boolean;
  extractedDates?: Date[];
  extractedEntities?: {
    amounts?: string[];
    names?: string[];
    organizations?: string[];
  };
}

/**
 * Confidence thresholds configuration
 */
export interface ConfidenceThresholds {
  retrieval: {
    minGeneration: number; // Default: 60
    minDisplay: number; // Default: 60
  };
  generation: {
    minDisplay: number; // Default: 60
    flagBelow: number; // Default: 80
  };
  parse: {
    minAccept: number; // Default: 70
    flagBelow: number; // Default: 80
  };
}

/**
 * Default confidence thresholds
 */
export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  retrieval: {
    minGeneration: 60,
    minDisplay: 60,
  },
  generation: {
    minDisplay: 60,
    flagBelow: 80,
  },
  parse: {
    minAccept: 70,
    flagBelow: 80,
  },
};
