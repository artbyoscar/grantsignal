/**
 * Confidence Scoring Service
 *
 * Calculates and validates confidence scores for:
 * - Document parsing
 * - RAG retrieval
 * - AI generation
 */

import type {
  ParseConfidenceComponents,
  ParseConfidenceResult,
  RetrievalConfidenceComponents,
  RetrievalConfidenceResult,
  GenerationConfidenceComponents,
  GenerationConfidenceResult,
  SourceDocument,
  ParsedDocumentMetadata,
  ConfidenceThresholds,
  ConfidenceLevel,
} from '@/types/confidence';
import { DEFAULT_CONFIDENCE_THRESHOLDS } from '@/types/confidence';

/**
 * Main confidence scoring service
 */
export class ConfidenceScoringService {
  private thresholds: ConfidenceThresholds;

  constructor(thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Calculate document parse confidence (0-100)
   *
   * Evaluates:
   * - Text extraction completeness (40%)
   * - Structure preservation (20%)
   * - Date/deadline extraction (25%)
   * - Entity extraction (15%)
   */
  calculateParseConfidence(metadata: ParsedDocumentMetadata): ParseConfidenceResult {
    const components: ParseConfidenceComponents = {
      textCompleteness: this.calculateTextCompleteness(metadata),
      structurePreservation: this.calculateStructurePreservation(metadata),
      dateExtraction: this.calculateDateExtraction(metadata),
      entityExtraction: this.calculateEntityExtraction(metadata),
    };

    // Weighted average
    const score = Math.round(
      components.textCompleteness * 0.4 +
      components.structurePreservation * 0.2 +
      components.dateExtraction * 0.25 +
      components.entityExtraction * 0.15
    );

    const level = this.getConfidenceLevel(score);
    const warnings = this.getParseWarnings(score, components);
    const message = this.getConfidenceMessage(score, level, 'parse');

    return {
      score,
      level,
      components,
      warnings,
      message,
    };
  }

  /**
   * Calculate RAG retrieval confidence (0-100)
   *
   * Evaluates:
   * - Cosine similarity from Pinecone (50%)
   * - Number of relevant chunks (20%)
   * - Recency of sources (15%)
   * - Source parse quality (15%)
   */
  calculateRetrievalConfidence(sources: SourceDocument[]): RetrievalConfidenceResult {
    if (sources.length === 0) {
      return {
        score: 0,
        level: 'low',
        components: {
          similarityScore: 0,
          chunkQuantity: 0,
          documentRecency: 0,
          sourceParseQuality: 0,
        },
        warnings: ['No sources found for query'],
        message: 'Insufficient context found for this query',
        shouldAllowGeneration: false,
      };
    }

    const components: RetrievalConfidenceComponents = {
      similarityScore: this.calculateSimilarityScore(sources),
      chunkQuantity: this.calculateChunkQuantity(sources),
      documentRecency: this.calculateDocumentRecency(sources),
      sourceParseQuality: this.calculateSourceParseQuality(sources),
    };

    // Weighted average
    const score = Math.round(
      components.similarityScore * 0.5 +
      components.chunkQuantity * 0.2 +
      components.documentRecency * 0.15 +
      components.sourceParseQuality * 0.15
    );

    const level = this.getConfidenceLevel(score);
    const warnings = this.getRetrievalWarnings(score, components, sources);
    const message = this.getConfidenceMessage(score, level, 'retrieval');
    const shouldAllowGeneration = this.shouldAllowGeneration(score);

    return {
      score,
      level,
      components,
      warnings,
      message,
      shouldAllowGeneration,
    };
  }

  /**
   * Calculate generation confidence (0-100)
   *
   * Evaluates:
   * - Average relevance of sources (40%)
   * - Coverage of query intent (30%)
   * - Fact verification against sources (30%)
   */
  calculateGenerationConfidence(
    content: string,
    sources: SourceDocument[],
    query?: string
  ): GenerationConfidenceResult {
    const components: GenerationConfidenceComponents = {
      sourceRelevance: this.calculateSourceRelevance(sources),
      queryCoverage: this.calculateQueryCoverage(content, query, sources),
      factVerification: this.calculateFactVerification(content, sources),
    };

    // Weighted average
    const score = Math.round(
      components.sourceRelevance * 0.4 +
      components.queryCoverage * 0.3 +
      components.factVerification * 0.3
    );

    const level = this.getConfidenceLevel(score);
    const warnings = this.getGenerationWarnings(score, components);
    const message = this.getConfidenceMessage(score, level, 'generation');
    const shouldDisplay = score >= this.thresholds.generation.minDisplay;

    return {
      score,
      level,
      components,
      warnings,
      message,
      shouldDisplay,
    };
  }

  /**
   * Determine if generation should be allowed based on retrieval confidence
   */
  shouldAllowGeneration(retrievalConfidence: number): boolean {
    return retrievalConfidence >= this.thresholds.retrieval.minGeneration;
  }

  /**
   * Get confidence level from score
   */
  getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Get user-friendly confidence message
   */
  getConfidenceMessage(score: number, level: ConfidenceLevel, type: 'parse' | 'retrieval' | 'generation'): string {
    const messages = {
      parse: {
        high: 'Document parsed successfully with high confidence',
        medium: 'Document parsed with moderate confidence, may require review',
        low: 'Document parsing had issues, manual review recommended',
      },
      retrieval: {
        high: 'Found highly relevant context from your documents',
        medium: 'Found relevant context, but may be incomplete',
        low: 'Limited relevant context found for this query',
      },
      generation: {
        high: 'Generated content is well-supported by sources',
        medium: 'Generated content has moderate source support',
        low: 'Generated content has limited source support',
      },
    };

    return messages[type][level];
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate text completeness score (0-100)
   * Based on text length, word count, and character quality
   */
  private calculateTextCompleteness(metadata: ParsedDocumentMetadata): number {
    let score = 100;
    const { text, wordCount } = metadata;

    // Penalty for very short text
    if (text.length < 100) {
      score -= 50;
    } else if (text.length < 500) {
      score -= 20;
    }

    // Penalty for low word count
    if (wordCount < 50) {
      score -= 30;
    } else if (wordCount < 200) {
      score -= 10;
    }

    // Bonus for substantial content
    if (wordCount > 1000) {
      score += 10;
    }

    // Check character quality (alphanumeric ratio)
    const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
    if (alphanumericRatio < 0.5) {
      score -= 40;
    } else if (alphanumericRatio < 0.7) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate structure preservation score (0-100)
   * Based on detected document type and structured data
   */
  private calculateStructurePreservation(metadata: ParsedDocumentMetadata): number {
    let score = 70; // Base score

    const { detectedType, hasStructuredData, pageCount } = metadata;

    // Adjust based on document type
    if (detectedType === 'pdf-text' || detectedType === 'docx') {
      score += 20; // Good structure preservation
    } else if (detectedType === 'pdf-scanned') {
      score -= 40; // Poor structure preservation (OCR)
    } else if (detectedType === 'text') {
      score += 10; // Plain text, simple structure
    }

    // Bonus for structured data
    if (hasStructuredData) {
      score += 10;
    }

    // Bonus for multi-page documents (likely have structure)
    if (pageCount && pageCount > 5) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate date extraction score (0-100)
   * Based on number and quality of extracted dates
   */
  private calculateDateExtraction(metadata: ParsedDocumentMetadata): number {
    const { extractedDates } = metadata;

    if (!extractedDates || extractedDates.length === 0) {
      // No dates found - could be okay for some documents
      return 50;
    }

    // Score based on number of dates found
    if (extractedDates.length >= 5) {
      return 100; // Excellent date extraction
    } else if (extractedDates.length >= 3) {
      return 85; // Good date extraction
    } else if (extractedDates.length >= 1) {
      return 70; // Moderate date extraction
    }

    return 50;
  }

  /**
   * Calculate entity extraction score (0-100)
   * Based on extracted names, amounts, organizations
   */
  private calculateEntityExtraction(metadata: ParsedDocumentMetadata): number {
    const { extractedEntities } = metadata;

    if (!extractedEntities) {
      return 50; // No entity extraction attempted
    }

    let score = 50;
    const { amounts, names, organizations } = extractedEntities;

    // Score based on entity types found
    if (amounts && amounts.length > 0) {
      score += 15;
    }
    if (names && names.length > 0) {
      score += 15;
    }
    if (organizations && organizations.length > 0) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate average similarity score from Pinecone (0-100)
   */
  private calculateSimilarityScore(sources: SourceDocument[]): number {
    const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
    return Math.round(avgScore * 100);
  }

  /**
   * Calculate chunk quantity score (0-100)
   * Based on number of relevant chunks found
   */
  private calculateChunkQuantity(sources: SourceDocument[]): number {
    // Ideal is 8-10 chunks for comprehensive context
    const idealChunkCount = 10;
    const score = Math.min(sources.length / idealChunkCount, 1) * 100;
    return Math.round(score);
  }

  /**
   * Calculate document recency score (0-100)
   * More recent documents score higher
   */
  private calculateDocumentRecency(sources: SourceDocument[]): number {
    const sourcesWithDates = sources.filter(s => s.createdAt);

    if (sourcesWithDates.length === 0) {
      return 70; // Neutral score if no dates available
    }

    const now = new Date();
    const avgAge = sourcesWithDates.reduce((sum, s) => {
      const ageInDays = (now.getTime() - s.createdAt!.getTime()) / (1000 * 60 * 60 * 24);
      return sum + ageInDays;
    }, 0) / sourcesWithDates.length;

    // Score based on average age
    if (avgAge <= 30) return 100; // Within last month
    if (avgAge <= 90) return 85;  // Within last 3 months
    if (avgAge <= 180) return 70; // Within last 6 months
    if (avgAge <= 365) return 55; // Within last year
    return 40; // Older than a year
  }

  /**
   * Calculate source parse quality score (0-100)
   * Based on parse confidence of source documents
   */
  private calculateSourceParseQuality(sources: SourceDocument[]): number {
    const sourcesWithParse = sources.filter(s => s.parseConfidence !== undefined);

    if (sourcesWithParse.length === 0) {
      return 80; // Assume good quality if not tracked
    }

    const avgParseConfidence = sourcesWithParse.reduce(
      (sum, s) => sum + (s.parseConfidence || 0),
      0
    ) / sourcesWithParse.length;

    return Math.round(avgParseConfidence);
  }

  /**
   * Calculate source relevance for generation (0-100)
   * Based on average similarity scores
   */
  private calculateSourceRelevance(sources: SourceDocument[]): number {
    if (sources.length === 0) return 0;
    return this.calculateSimilarityScore(sources);
  }

  /**
   * Calculate query coverage score (0-100)
   * Estimates how well the generated content covers the query intent
   */
  private calculateQueryCoverage(content: string, query: string | undefined, sources: SourceDocument[]): number {
    if (!query) {
      return 70; // Neutral score if no query provided
    }

    // Basic heuristic: check if key terms from query appear in content
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const contentLower = content.toLowerCase();

    const coveredTerms = queryTerms.filter(term => contentLower.includes(term));
    const coverageRatio = queryTerms.length > 0 ? coveredTerms.length / queryTerms.length : 0;

    // Factor in content length (longer content may cover more)
    const lengthBonus = Math.min(content.length / 1000, 0.2) * 100; // Up to 20 points

    const baseScore = coverageRatio * 80;
    return Math.min(100, Math.round(baseScore + lengthBonus));
  }

  /**
   * Calculate fact verification score (0-100)
   * Estimates how well facts in content align with sources
   */
  private calculateFactVerification(content: string, sources: SourceDocument[]): number {
    if (sources.length === 0) {
      return 0; // No sources to verify against
    }

    // Heuristic: measure content overlap with source text
    const sourceText = sources.map(s => s.text.toLowerCase()).join(' ');
    const contentLower = content.toLowerCase();

    // Extract key phrases from content (5+ character words)
    const contentPhrases = contentLower.match(/\b\w{5,}\b/g) || [];

    if (contentPhrases.length === 0) {
      return 50; // Neutral if no phrases to check
    }

    // Count how many content phrases appear in sources
    const verifiedPhrases = contentPhrases.filter(phrase =>
      sourceText.includes(phrase)
    );

    const verificationRatio = verifiedPhrases.length / contentPhrases.length;

    // Higher ratio means better fact verification
    return Math.round(verificationRatio * 100);
  }

  /**
   * Generate parse warnings based on component scores
   */
  private getParseWarnings(score: number, components: ParseConfidenceComponents): string[] {
    const warnings: string[] = [];

    if (components.textCompleteness < 60) {
      warnings.push('Text extraction may be incomplete');
    }
    if (components.structurePreservation < 60) {
      warnings.push('Document structure may not be fully preserved');
    }
    if (components.dateExtraction < 60) {
      warnings.push('Date extraction may be incomplete');
    }
    if (components.entityExtraction < 60) {
      warnings.push('Entity extraction may be incomplete');
    }
    if (score < this.thresholds.parse.minAccept) {
      warnings.push('Document quality below acceptance threshold');
    }

    return warnings;
  }

  /**
   * Generate retrieval warnings based on component scores
   */
  private getRetrievalWarnings(
    score: number,
    components: RetrievalConfidenceComponents,
    sources: SourceDocument[]
  ): string[] {
    const warnings: string[] = [];

    if (components.similarityScore < 70) {
      warnings.push('Low similarity scores - results may not be highly relevant');
    }
    if (components.chunkQuantity < 50) {
      warnings.push('Few relevant chunks found - context may be limited');
    }
    if (components.documentRecency < 50) {
      warnings.push('Source documents may be outdated');
    }
    if (components.sourceParseQuality < 70) {
      warnings.push('Some source documents had parsing issues');
    }
    if (sources.length === 0) {
      warnings.push('No relevant sources found');
    }
    if (!this.shouldAllowGeneration(score)) {
      warnings.push('Confidence too low for AI generation');
    }

    return warnings;
  }

  /**
   * Generate generation warnings based on component scores
   */
  private getGenerationWarnings(score: number, components: GenerationConfidenceComponents): string[] {
    const warnings: string[] = [];

    if (components.sourceRelevance < 70) {
      warnings.push('Generated content may have weak source support');
    }
    if (components.queryCoverage < 70) {
      warnings.push('Generated content may not fully address the query');
    }
    if (components.factVerification < 70) {
      warnings.push('Generated content may contain unverified information');
    }
    if (score < this.thresholds.generation.flagBelow) {
      warnings.push('Content should be carefully reviewed before use');
    }
    if (score < this.thresholds.generation.minDisplay) {
      warnings.push('Content quality below display threshold');
    }

    return warnings;
  }
}

// Export singleton instance with default thresholds
export const confidenceScoring = new ConfidenceScoringService();
