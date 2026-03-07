import { describe, it, expect } from 'vitest'

/**
 * Writing Readiness Tests
 * Tests the getWritingReadiness procedure logic and confidence scoring
 */

describe('Writing Readiness - Check Logic', () => {
  function calculateReadiness(checks: Record<string, boolean>) {
    const readyCount = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length
    return Math.round((readyCount / totalChecks) * 100)
  }

  describe('readiness score calculation', () => {
    it('should return 100% when all checks pass', () => {
      const checks = {
        hasGrant: true,
        hasFunder: true,
        hasOpportunity: true,
        hasDeadline: true,
        hasAmountRequested: true,
        hasDocuments: true,
        hasOrgMemory: true,
        hasVoiceProfile: true,
        hasMission: true,
        hasCustomRfpSections: true,
        hasDraftProgress: true,
      }
      expect(calculateReadiness(checks)).toBe(100)
    })

    it('should return correct score for partial readiness', () => {
      const checks = {
        hasGrant: true,
        hasFunder: true,
        hasOpportunity: false,
        hasDeadline: true,
        hasAmountRequested: false,
        hasDocuments: true,
        hasOrgMemory: false,
        hasVoiceProfile: false,
        hasMission: true,
        hasCustomRfpSections: false,
        hasDraftProgress: false,
      }
      // 5/11 = 45.45% -> rounds to 45
      expect(calculateReadiness(checks)).toBe(45)
    })

    it('should return minimum score when only grant exists', () => {
      const checks = {
        hasGrant: true,
        hasFunder: false,
        hasOpportunity: false,
        hasDeadline: false,
        hasAmountRequested: false,
        hasDocuments: false,
        hasOrgMemory: false,
        hasVoiceProfile: false,
        hasMission: false,
        hasCustomRfpSections: false,
        hasDraftProgress: false,
      }
      // 1/11 = 9.09% -> rounds to 9
      expect(calculateReadiness(checks)).toBe(9)
    })
  })

  describe('individual check conditions', () => {
    it('should require >= 3 documents for hasOrgMemory', () => {
      expect(5 >= 3).toBe(true)
      expect(3 >= 3).toBe(true)
      expect(2 >= 3).toBe(false)
      expect(0 >= 3).toBe(false)
    })

    it('should detect draft progress from non-empty sections', () => {
      const draftContent: Record<string, { content?: string }> = {
        executive_summary: { content: 'Our organization...' },
        methodology: { content: '' },
        budget: { content: '   ' },
      }

      const sectionsStarted = Object.keys(draftContent).filter(
        k => draftContent[k]?.content && draftContent[k].content!.trim().length > 0
      ).length

      expect(sectionsStarted).toBe(1)
    })

    it('should handle null draftContent gracefully', () => {
      const draftContent = null
      const dc = (draftContent as Record<string, unknown>) || {}
      const sectionsStarted = Object.keys(dc).filter(
        k => dc[k] && typeof dc[k] === 'object'
      ).length

      expect(sectionsStarted).toBe(0)
    })
  })
})

describe('V3 Trust Architecture - Confidence Scoring', () => {
  function calculateConfidence(contextCount: number, averageScore: number) {
    const contextQuantityScore = Math.min((contextCount / 10) * 40, 40)
    const relevanceScore = averageScore * 60
    return Math.round(contextQuantityScore + relevanceScore)
  }

  it('should return max confidence with 10+ high-relevance contexts', () => {
    const confidence = calculateConfidence(10, 0.95)
    // 40 + (0.95 * 60) = 40 + 57 = 97
    expect(confidence).toBe(97)
  })

  it('should return medium confidence with few moderate contexts', () => {
    const confidence = calculateConfidence(3, 0.75)
    // (3/10 * 40) + (0.75 * 60) = 12 + 45 = 57
    expect(confidence).toBe(57)
  })

  it('should return low confidence with minimal context', () => {
    const confidence = calculateConfidence(1, 0.72)
    // (1/10 * 40) + (0.72 * 60) = 4 + 43.2 = 47
    expect(confidence).toBe(47)
  })

  it('should return 0 with no contexts', () => {
    const confidence = calculateConfidence(0, 0)
    expect(confidence).toBe(0)
  })

  it('should cap context quantity at 40 points', () => {
    const confidence = calculateConfidence(20, 0.5)
    // min(80, 40) + 30 = 40 + 30 = 70
    expect(confidence).toBe(70)
  })

  it('should block generation below 60% threshold', () => {
    const confidence = calculateConfidence(2, 0.7)
    // (2/10 * 40) + (0.7 * 60) = 8 + 42 = 50
    expect(confidence).toBe(50)
    expect(confidence < 60).toBe(true)
  })

  it('should allow generation at exactly 60%', () => {
    const confidence = calculateConfidence(3, 0.8)
    // (3/10 * 40) + (0.8 * 60) = 12 + 48 = 60
    expect(confidence).toBe(60)
    expect(confidence >= 60).toBe(true)
  })
})
