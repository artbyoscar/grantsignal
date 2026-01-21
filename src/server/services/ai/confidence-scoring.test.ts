/**
 * Unit tests for Confidence Scoring Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfidenceScoringService } from './confidence-scoring';
import type {
  ParsedDocumentMetadata,
  SourceDocument,
  ConfidenceThresholds,
} from '@/types/confidence';

describe('ConfidenceScoringService', () => {
  let service: ConfidenceScoringService;

  beforeEach(() => {
    service = new ConfidenceScoringService();
  });

  describe('getConfidenceLevel', () => {
    it('should return high for scores >= 80', () => {
      expect(service.getConfidenceLevel(100)).toBe('high');
      expect(service.getConfidenceLevel(85)).toBe('high');
      expect(service.getConfidenceLevel(80)).toBe('high');
    });

    it('should return medium for scores 60-79', () => {
      expect(service.getConfidenceLevel(79)).toBe('medium');
      expect(service.getConfidenceLevel(70)).toBe('medium');
      expect(service.getConfidenceLevel(60)).toBe('medium');
    });

    it('should return low for scores < 60', () => {
      expect(service.getConfidenceLevel(59)).toBe('low');
      expect(service.getConfidenceLevel(30)).toBe('low');
      expect(service.getConfidenceLevel(0)).toBe('low');
    });
  });

  describe('shouldAllowGeneration', () => {
    it('should allow generation for confidence >= 60', () => {
      expect(service.shouldAllowGeneration(100)).toBe(true);
      expect(service.shouldAllowGeneration(75)).toBe(true);
      expect(service.shouldAllowGeneration(60)).toBe(true);
    });

    it('should not allow generation for confidence < 60', () => {
      expect(service.shouldAllowGeneration(59)).toBe(false);
      expect(service.shouldAllowGeneration(30)).toBe(false);
      expect(service.shouldAllowGeneration(0)).toBe(false);
    });
  });

  describe('getConfidenceMessage', () => {
    it('should return appropriate messages for parse type', () => {
      const highMsg = service.getConfidenceMessage(85, 'high', 'parse');
      expect(highMsg).toContain('high confidence');

      const medMsg = service.getConfidenceMessage(70, 'medium', 'parse');
      expect(medMsg).toContain('moderate confidence');

      const lowMsg = service.getConfidenceMessage(40, 'low', 'parse');
      expect(lowMsg).toContain('issues');
    });

    it('should return appropriate messages for retrieval type', () => {
      const highMsg = service.getConfidenceMessage(85, 'high', 'retrieval');
      expect(highMsg).toContain('highly relevant');

      const medMsg = service.getConfidenceMessage(70, 'medium', 'retrieval');
      expect(medMsg).toContain('relevant');

      const lowMsg = service.getConfidenceMessage(40, 'low', 'retrieval');
      expect(lowMsg).toContain('Limited');
    });

    it('should return appropriate messages for generation type', () => {
      const highMsg = service.getConfidenceMessage(85, 'high', 'generation');
      expect(highMsg).toContain('well-supported');

      const medMsg = service.getConfidenceMessage(70, 'medium', 'generation');
      expect(medMsg).toContain('moderate');

      const lowMsg = service.getConfidenceMessage(40, 'low', 'generation');
      expect(lowMsg).toContain('limited');
    });
  });

  describe('calculateParseConfidence', () => {
    it('should score high confidence for well-formed document', () => {
      const metadata: ParsedDocumentMetadata = {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50),
        wordCount: 400,
        pageCount: 10,
        detectedType: 'pdf-text',
        hasStructuredData: true,
        extractedDates: [new Date(), new Date(), new Date()],
        extractedEntities: {
          amounts: ['$100,000', '$50,000'],
          names: ['John Doe', 'Jane Smith'],
          organizations: ['Acme Corp', 'XYZ Foundation'],
        },
      };

      const result = service.calculateParseConfidence(metadata);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.level).toBe('high');
      expect(result.warnings.length).toBe(0);
    });

    it('should score low confidence for poor document', () => {
      const metadata: ParsedDocumentMetadata = {
        text: 'Bad text ###',
        wordCount: 2,
        detectedType: 'pdf-scanned',
        hasStructuredData: false,
      };

      const result = service.calculateParseConfidence(metadata);

      expect(result.score).toBeLessThan(60);
      expect(result.level).toBe('low');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should penalize very short text', () => {
      const shortDoc: ParsedDocumentMetadata = {
        text: 'Short',
        wordCount: 1,
      };

      const longDoc: ParsedDocumentMetadata = {
        text: 'Lorem ipsum dolor sit amet '.repeat(100),
        wordCount: 500,
      };

      const shortResult = service.calculateParseConfidence(shortDoc);
      const longResult = service.calculateParseConfidence(longDoc);

      expect(shortResult.score).toBeLessThan(longResult.score);
    });

    it('should handle missing optional fields gracefully', () => {
      const metadata: ParsedDocumentMetadata = {
        text: 'Some reasonable text content here that is long enough to parse well.',
        wordCount: 12,
      };

      const result = service.calculateParseConfidence(metadata);

      expect(result.score).toBeGreaterThan(0);
      expect(result.level).toBeDefined();
      expect(result.components).toBeDefined();
    });
  });

  describe('calculateRetrievalConfidence', () => {
    it('should score high confidence for excellent retrieval', () => {
      const sources: SourceDocument[] = [
        {
          documentId: 'doc1',
          documentName: 'Grant Guidelines',
          text: 'Relevant content about eligibility...',
          score: 0.95,
          chunkIndex: 0,
          parseConfidence: 95,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          documentId: 'doc2',
          documentName: 'Application Form',
          text: 'Required information for submission...',
          score: 0.92,
          chunkIndex: 1,
          parseConfidence: 90,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        },
        {
          documentId: 'doc3',
          documentName: 'Past Award',
          text: 'Previous successful application...',
          score: 0.88,
          chunkIndex: 0,
          parseConfidence: 92,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        },
      ];

      const result = service.calculateRetrievalConfidence(sources);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.level).toBe('high');
      expect(result.shouldAllowGeneration).toBe(true);
      expect(result.warnings.length).toBeLessThanOrEqual(1);
    });

    it('should score low confidence for poor retrieval', () => {
      const sources: SourceDocument[] = [
        {
          documentId: 'doc1',
          documentName: 'Unrelated Doc',
          text: 'Not very relevant...',
          score: 0.55,
          chunkIndex: 0,
          parseConfidence: 60,
          createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // Over a year old
        },
      ];

      const result = service.calculateRetrievalConfidence(sources);

      expect(result.score).toBeLessThan(60);
      expect(result.level).toBe('low');
      expect(result.shouldAllowGeneration).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty sources', () => {
      const result = service.calculateRetrievalConfidence([]);

      expect(result.score).toBe(0);
      expect(result.level).toBe('low');
      expect(result.shouldAllowGeneration).toBe(false);
      expect(result.warnings).toContain('No sources found for query');
    });

    it('should weight similarity score heavily (50%)', () => {
      const highSimilarity: SourceDocument[] = [
        {
          documentId: 'doc1',
          documentName: 'Doc 1',
          text: 'Content',
          score: 0.98, // Very high similarity
          chunkIndex: 0,
        },
      ];

      const lowSimilarity: SourceDocument[] = [
        {
          documentId: 'doc1',
          documentName: 'Doc 1',
          text: 'Content',
          score: 0.60, // Low similarity
          chunkIndex: 0,
        },
      ];

      const highResult = service.calculateRetrievalConfidence(highSimilarity);
      const lowResult = service.calculateRetrievalConfidence(lowSimilarity);

      expect(highResult.score).toBeGreaterThan(lowResult.score + 10);
    });

    it('should favor recent documents', () => {
      const recentSources: SourceDocument[] = [
        {
          documentId: 'doc1',
          documentName: 'Recent',
          text: 'Content',
          score: 0.85,
          chunkIndex: 0,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      ];

      const oldSources: SourceDocument[] = [
        {
          documentId: 'doc2',
          documentName: 'Old',
          text: 'Content',
          score: 0.85,
          chunkIndex: 0,
          createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // Over a year
        },
      ];

      const recentResult = service.calculateRetrievalConfidence(recentSources);
      const oldResult = service.calculateRetrievalConfidence(oldSources);

      expect(recentResult.components.documentRecency).toBeGreaterThan(
        oldResult.components.documentRecency
      );
    });
  });

  describe('calculateGenerationConfidence', () => {
    const mockSources: SourceDocument[] = [
      {
        documentId: 'doc1',
        documentName: 'Guidelines',
        text: 'Applicants must submit eligibility documentation including financial statements and organizational charts.',
        score: 0.90,
        chunkIndex: 0,
      },
      {
        documentId: 'doc2',
        documentName: 'Requirements',
        text: 'The deadline for submission is March 31st. Late applications will not be accepted.',
        score: 0.85,
        chunkIndex: 1,
      },
    ];

    it('should score high confidence for well-supported content', () => {
      const content = 'Applicants must submit eligibility documentation by the March 31st deadline.';
      const query = 'What documents are required and when is the deadline?';

      const result = service.calculateGenerationConfidence(content, mockSources, query);

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.shouldDisplay).toBe(true);
    });

    it('should score low confidence for unsupported content', () => {
      const content = 'The program offers unlimited funding for all organizations worldwide.';
      const query = 'What is the funding amount?';

      const result = service.calculateGenerationConfidence(content, mockSources, query);

      expect(result.score).toBeLessThan(80);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty sources', () => {
      const content = 'Some generated content';
      const query = 'A query';

      const result = service.calculateGenerationConfidence(content, [], query);

      expect(result.score).toBeLessThan(50);
      expect(result.shouldDisplay).toBe(false);
    });

    it('should factor in query coverage', () => {
      const goodCoverage = 'Eligibility documentation is required. The deadline is March 31st.';
      const poorCoverage = 'Some information about grants.';
      const query = 'eligibility documentation deadline requirements';

      const goodResult = service.calculateGenerationConfidence(goodCoverage, mockSources, query);
      const poorResult = service.calculateGenerationConfidence(poorCoverage, mockSources, query);

      expect(goodResult.components.queryCoverage).toBeGreaterThan(
        poorResult.components.queryCoverage
      );
    });

    it('should work without query parameter', () => {
      const content = 'Applicants must submit documentation.';

      const result = service.calculateGenerationConfidence(content, mockSources);

      expect(result.score).toBeGreaterThan(0);
      expect(result.components.queryCoverage).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Custom thresholds', () => {
    it('should respect custom thresholds', () => {
      const customThresholds: ConfidenceThresholds = {
        retrieval: {
          minGeneration: 70,
          minDisplay: 50,
        },
        generation: {
          minDisplay: 50,
          flagBelow: 70,
        },
        parse: {
          minAccept: 60,
          flagBelow: 70,
        },
      };

      const customService = new ConfidenceScoringService(customThresholds);

      expect(customService.shouldAllowGeneration(65)).toBe(false);
      expect(customService.shouldAllowGeneration(70)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle extremely low scores', () => {
      const metadata: ParsedDocumentMetadata = {
        text: '',
        wordCount: 0,
      };

      const result = service.calculateParseConfidence(metadata);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should cap scores at 100', () => {
      const excellentDoc: ParsedDocumentMetadata = {
        text: 'Excellent content '.repeat(200),
        wordCount: 2000,
        pageCount: 50,
        detectedType: 'pdf-text',
        hasStructuredData: true,
        extractedDates: Array(10).fill(new Date()),
        extractedEntities: {
          amounts: Array(10).fill('$100'),
          names: Array(10).fill('Name'),
          organizations: Array(10).fill('Org'),
        },
      };

      const result = service.calculateParseConfidence(excellentDoc);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle sources with missing optional fields', () => {
      const sources: SourceDocument[] = [
        {
          documentId: 'doc1',
          documentName: 'Doc 1',
          text: 'Content',
          score: 0.85,
          chunkIndex: 0,
          // No parseConfidence or createdAt
        },
      ];

      const result = service.calculateRetrievalConfidence(sources);

      expect(result.score).toBeGreaterThan(0);
      expect(result.components).toBeDefined();
    });
  });
});
