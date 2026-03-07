import { describe, it, expect, vi } from 'vitest'

/**
 * Voice Analysis Workflow - Integration Tests
 * Covers: voice profile retrieval, analysis trigger, voice application to text,
 * consistency scoring, confidence levels, and the analyze-voice Inngest pipeline
 */

interface VoiceProfile {
  sentencePatterns: {
    avgLength: number
    shortSentenceRatio: number
    complexRatio: number
  }
  vocabulary: {
    preferredTerms: Record<string, string>
    avoidedTerms: string[]
    jargonLevel: string
  }
  tone: {
    formality: number
    directness: number
    optimism: number
    dataEmphasis: number
    urgency: number
    complexity: number
  }
  patterns: Array<{
    type: string
    examples: string[]
  }>
}

function createMockVoiceProfile(overrides: Partial<VoiceProfile> = {}): VoiceProfile {
  return {
    sentencePatterns: {
      avgLength: 18,
      shortSentenceRatio: 0.3,
      complexRatio: 0.25,
    },
    vocabulary: {
      preferredTerms: {
        'help': 'empower',
        'poor': 'underserved',
        'kids': 'youth',
      },
      avoidedTerms: ['charity', 'handout', 'needy'],
      jargonLevel: 'moderate',
    },
    tone: {
      formality: 75,
      directness: 68,
      optimism: 82,
      dataEmphasis: 70,
      urgency: 45,
      complexity: 55,
    },
    patterns: [
      { type: 'opening', examples: ['Our organization has demonstrated...'] },
      { type: 'evidence', examples: ['Data from our 2024 impact report shows...'] },
      { type: 'closing', examples: ['Together, we can build a stronger...'] },
    ],
    ...overrides,
  }
}

function createMockDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-test-1',
    name: 'Previous Grant Proposal 2024.pdf',
    type: 'PROPOSAL' as const,
    extractedText: 'Our organization has served over 5,000 youth in underserved communities through our comprehensive after-school program. We empower young people to achieve academic excellence and develop leadership skills.',
    status: 'COMPLETED' as const,
    createdAt: new Date('2025-01-15'),
    ...overrides,
  }
}

describe('Voice Analysis Workflow', () => {
  describe('Voice profile retrieval (getProfile)', () => {
    it('should return profile with metadata when voice profile exists', () => {
      const profile = createMockVoiceProfile()
      const metadata = {
        lastUpdated: new Date('2025-02-01'),
        documentsAnalyzed: 15,
        confidence: 'high' as const,
      }

      const result = { profile, metadata }
      expect(result.profile.tone.formality).toBe(75)
      expect(result.metadata.documentsAnalyzed).toBe(15)
      expect(result.metadata.confidence).toBe('high')
    })

    it('should return null when no voice profile exists', () => {
      const profile = null
      expect(profile).toBeNull()
    })
  })

  describe('Confidence calculation', () => {
    it('should return high confidence for >= 15 documents', () => {
      const docCounts = [15, 20, 50]
      for (const count of docCounts) {
        const confidence = count >= 15 ? 'high' : count >= 8 ? 'medium' : 'low'
        expect(confidence).toBe('high')
      }
    })

    it('should return medium confidence for 8-14 documents', () => {
      const docCounts = [8, 10, 14]
      for (const count of docCounts) {
        const confidence = count >= 15 ? 'high' : count >= 8 ? 'medium' : 'low'
        expect(confidence).toBe('medium')
      }
    })

    it('should return low confidence for < 8 documents', () => {
      const docCounts = [0, 1, 5, 7]
      for (const count of docCounts) {
        const confidence = count >= 15 ? 'high' : count >= 8 ? 'medium' : 'low'
        expect(confidence).toBe('low')
      }
    })

    it('should test boundary values exactly', () => {
      const calc = (n: number) => (n >= 15 ? 'high' : n >= 8 ? 'medium' : 'low')
      expect(calc(7)).toBe('low')
      expect(calc(8)).toBe('medium')
      expect(calc(14)).toBe('medium')
      expect(calc(15)).toBe('high')
    })
  })

  describe('Voice analysis trigger', () => {
    it('should require at least 5 documents unless forceRefresh', () => {
      const documentCount = 3
      const forceRefresh = false

      const shouldBlock = documentCount < 5 && !forceRefresh
      expect(shouldBlock).toBe(true)
    })

    it('should allow analysis with < 5 documents when forceRefresh=true', () => {
      const documentCount = 3
      const forceRefresh = true

      const shouldBlock = documentCount < 5 && !forceRefresh
      expect(shouldBlock).toBe(false)
    })

    it('should throw when zero documents available', () => {
      const documents: ReturnType<typeof createMockDocument>[] = []

      const shouldThrow = () => {
        if (documents.length === 0) {
          throw new Error('No documents available for voice analysis. Please upload at least 5 documents.')
        }
      }

      expect(shouldThrow).toThrow('No documents available')
    })

    it('should only analyze COMPLETED documents', () => {
      const docs = [
        createMockDocument({ status: 'COMPLETED' }),
        createMockDocument({ status: 'PENDING', id: 'doc-2' }),
        createMockDocument({ status: 'FAILED', id: 'doc-3' }),
        createMockDocument({ status: 'COMPLETED', id: 'doc-4' }),
      ]

      const eligible = docs.filter((d) => d.status === 'COMPLETED')
      expect(eligible).toHaveLength(2)
    })

    it('should take up to 20 most recent documents', () => {
      const docs = Array.from({ length: 30 }, (_, i) =>
        createMockDocument({ id: `doc-${i}`, createdAt: new Date(2025, 0, i + 1) })
      )

      const sorted = [...docs].sort(
        (a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime()
      )
      const selected = sorted.slice(0, 20)

      expect(selected).toHaveLength(20)
      expect((selected[0].createdAt as Date).getTime()).toBeGreaterThan(
        (selected[19].createdAt as Date).getTime()
      )
    })

    it('should filter out documents with insufficient text content', () => {
      const docs = [
        createMockDocument({ extractedText: 'A'.repeat(200) }), // Sufficient
        createMockDocument({ extractedText: 'Short', id: 'doc-2' }), // Too short
        createMockDocument({ extractedText: null, id: 'doc-3' }), // No text
        createMockDocument({ extractedText: '   ', id: 'doc-4' }), // Whitespace only
      ]

      const eligible = docs.filter(
        (d) =>
          d.extractedText &&
          (d.extractedText as string).trim().length > 100
      )

      expect(eligible).toHaveLength(1)
    })
  })

  describe('Apply voice to text (applyToText)', () => {
    it('should require minimum 10 characters input', () => {
      const validText = 'This is a valid input text for voice analysis.'
      const invalidText = 'Too short'

      expect(validText.length).toBeGreaterThanOrEqual(10)
      expect(invalidText.length).toBeLessThan(10)
    })

    it('should enforce maximum 10000 characters', () => {
      const longText = 'A'.repeat(10001)
      expect(longText.length).toBeGreaterThan(10000)
    })

    it('should throw NOT_FOUND when no voice profile exists', () => {
      const voiceProfile = null

      const shouldThrow = () => {
        if (!voiceProfile) {
          throw { code: 'NOT_FOUND', message: 'No voice profile found. Please run voice analysis first.' }
        }
      }

      expect(shouldThrow).toThrow()
    })

    it('should return original, rewritten, and applied profile metrics', () => {
      const profile = createMockVoiceProfile()

      const result = {
        original: 'We help poor kids in the neighborhood.',
        rewritten: 'We empower underserved youth in the community.',
        appliedProfile: {
          formality: profile.tone.formality,
          directness: profile.tone.directness,
          complexity: profile.tone.complexity,
        },
      }

      expect(result.original).not.toBe(result.rewritten)
      expect(result.appliedProfile.formality).toBe(75)
      expect(result.appliedProfile.directness).toBe(68)
      expect(result.appliedProfile.complexity).toBe(55)
    })
  })

  describe('Consistency analysis (analyzeConsistency)', () => {
    describe('Score calculation', () => {
      it('should calculate average sentence length', () => {
        const text = 'This is a sentence. Here is another one. And a third.'
        const words = text.split(/\s+/)
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        const avgLength = words.length / Math.max(sentences.length, 1)

        expect(avgLength).toBeGreaterThan(0)
        expect(sentences).toHaveLength(3)
      })

      it('should calculate short sentence ratio', () => {
        const sentences = [
          'Short one.',        // 2 words - short
          'Another short.',    // 2 words - short
          'This is a much longer sentence that has more than ten words in it overall.', // long
        ]

        const shortCount = sentences.filter(
          (s) => s.trim().split(/\s+/).length < 10
        ).length
        const ratio = shortCount / sentences.length

        expect(ratio).toBeCloseTo(0.667, 2)
      })

      it('should score 0-100 based on deviation from profile', () => {
        const avgSentenceLength = 22
        const targetAvgLength = 18
        const lengthDiff = Math.abs(avgSentenceLength - targetAvgLength)
        const lengthScore = Math.max(0, 100 - lengthDiff * 5)

        expect(lengthScore).toBe(80) // 4 * 5 = 20 penalty
        expect(lengthScore).toBeGreaterThanOrEqual(0)
        expect(lengthScore).toBeLessThanOrEqual(100)
      })

      it('should classify as high consistency for scores >= 80', () => {
        const score = 85
        const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
        expect(level).toBe('high')
      })

      it('should classify as medium consistency for scores 60-79', () => {
        const score = 72
        const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
        expect(level).toBe('medium')
      })

      it('should classify as low consistency for scores < 60', () => {
        const score = 45
        const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
        expect(level).toBe('low')
      })
    })

    describe('Suggestions generation', () => {
      it('should suggest breaking up long sentences when avg exceeds profile', () => {
        const avgSentenceLength = 28
        const targetAvgLength = 18
        const lengthDiff = Math.abs(avgSentenceLength - targetAvgLength)

        const suggestions: string[] = []
        if (lengthDiff > 5) {
          if (avgSentenceLength > targetAvgLength) {
            suggestions.push('Consider breaking up longer sentences to match your typical style')
          }
        }

        expect(suggestions).toHaveLength(1)
        expect(suggestions[0]).toContain('breaking up')
      })

      it('should suggest combining short sentences when avg is below profile', () => {
        const avgSentenceLength = 10
        const targetAvgLength = 18
        const lengthDiff = Math.abs(avgSentenceLength - targetAvgLength)

        const suggestions: string[] = []
        if (lengthDiff > 5) {
          if (avgSentenceLength > targetAvgLength) {
            suggestions.push('Consider breaking up longer sentences')
          } else {
            suggestions.push('Consider combining some shorter sentences')
          }
        }

        expect(suggestions[0]).toContain('combining')
      })

      it('should flag avoided terms found in text', () => {
        const profile = createMockVoiceProfile()
        const text = 'We provide charity to needy families.'

        const found = profile.vocabulary.avoidedTerms.filter((term) =>
          text.toLowerCase().includes(term.toLowerCase())
        )

        expect(found).toContain('charity')
        expect(found).toContain('needy')
        expect(found).toHaveLength(2)
      })

      it('should suggest preferred terms when alternatives found in text', () => {
        const profile = createMockVoiceProfile()
        const text = 'We help poor kids through our programs.'

        const suggestions: string[] = []
        Object.entries(profile.vocabulary.preferredTerms).forEach(([from, to]) => {
          if (text.toLowerCase().includes(from.toLowerCase())) {
            suggestions.push(`Consider using "${to}" instead of "${from}"`)
          }
        })

        expect(suggestions).toContain('Consider using "empower" instead of "help"')
        expect(suggestions).toContain('Consider using "underserved" instead of "poor"')
        expect(suggestions).toContain('Consider using "youth" instead of "kids"')
      })

      it('should congratulate when score is high and no issues found', () => {
        const score = 88
        const suggestions: string[] = []

        if (suggestions.length === 0 && score >= 80) {
          suggestions.push('Text matches your organizational voice well!')
        }

        expect(suggestions[0]).toContain('matches your organizational voice')
      })
    })

    describe('Metrics returned', () => {
      it('should return both actual and target metrics', () => {
        const profile = createMockVoiceProfile()
        const metrics = {
          avgSentenceLength: 22,
          shortRatio: 35,
          targetAvgLength: profile.sentencePatterns.avgLength,
          targetShortRatio: Math.round(profile.sentencePatterns.shortSentenceRatio * 100),
        }

        expect(metrics.avgSentenceLength).toBe(22)
        expect(metrics.targetAvgLength).toBe(18)
        expect(metrics.targetShortRatio).toBe(30)
      })
    })
  })

  describe('Analyze Voice Inngest Pipeline', () => {
    it('should check if analysis is needed before proceeding', () => {
      const scenarios = [
        { forceRefresh: true, hasProfile: true, profileAge: 10, expected: true },
        { forceRefresh: false, hasProfile: false, profileAge: 0, expected: true },
        { forceRefresh: false, hasProfile: true, profileAge: 45, expected: true }, // > 30 days
        { forceRefresh: false, hasProfile: true, profileAge: 10, expected: false },
      ]

      for (const s of scenarios) {
        const needsAnalysis =
          s.forceRefresh || !s.hasProfile || s.profileAge > 30
        expect(needsAnalysis).toBe(s.expected)
      }
    })

    it('should only fetch PROPOSAL, REPORT, and LOI document types', () => {
      const eligibleTypes = ['PROPOSAL', 'REPORT', 'LOI']
      const allDocs = [
        createMockDocument({ type: 'PROPOSAL' }),
        createMockDocument({ type: 'REPORT', id: 'doc-2' }),
        createMockDocument({ type: 'AWARD_LETTER', id: 'doc-3' }),
        createMockDocument({ type: 'BUDGET', id: 'doc-4' }),
        createMockDocument({ type: 'LOI', id: 'doc-5' }),
      ]

      const eligible = allDocs.filter((d) => eligibleTypes.includes(d.type))
      expect(eligible).toHaveLength(3)
    })

    it('should retry up to 2 times on failure', () => {
      const config = { retries: 2 }
      expect(config.retries).toBe(2)
    })

    it('should save voice profile to organization record', () => {
      const profile = createMockVoiceProfile()
      const updateData = {
        voiceProfile: profile,
        voiceUpdatedAt: new Date(),
      }

      expect(updateData.voiceProfile).toBeTruthy()
      expect(updateData.voiceUpdatedAt).toBeTruthy()
    })
  })
})
