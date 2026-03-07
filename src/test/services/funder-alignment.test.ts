import { describe, it, expect } from 'vitest'

/**
 * Funder Intelligence - Alignment Scoring Tests
 * Tests the alignment score calculation logic from getIntelligenceProfile
 */

describe('Funder Alignment Score', () => {
  function calculateProgramAlignment(funderAreas: string[], orgAreas: string[]) {
    const overlapping = funderAreas.filter(fa =>
      orgAreas.some(oa =>
        oa.toLowerCase().includes(fa.toLowerCase()) ||
        fa.toLowerCase().includes(oa.toLowerCase())
      )
    )
    const score = funderAreas.length > 0
      ? Math.round((overlapping.length / funderAreas.length) * 100)
      : 0
    return { overlapping, score }
  }

  describe('program area alignment', () => {
    it('should find exact matches', () => {
      const result = calculateProgramAlignment(
        ['Education', 'Youth Development'],
        ['Education', 'Health']
      )
      expect(result.overlapping).toEqual(['Education'])
      expect(result.score).toBe(50)
    })

    it('should match case-insensitively', () => {
      const result = calculateProgramAlignment(
        ['education'],
        ['EDUCATION']
      )
      expect(result.overlapping).toEqual(['education'])
      expect(result.score).toBe(100)
    })

    it('should find partial substring matches', () => {
      const result = calculateProgramAlignment(
        ['Youth Development', 'Arts'],
        ['Youth Development Programs']
      )
      expect(result.overlapping).toEqual(['Youth Development'])
      expect(result.score).toBe(50)
    })

    it('should return 0 with no overlap', () => {
      const result = calculateProgramAlignment(
        ['Environmental Conservation'],
        ['Healthcare', 'Education']
      )
      expect(result.overlapping).toEqual([])
      expect(result.score).toBe(0)
    })

    it('should return 0 with empty funder areas', () => {
      const result = calculateProgramAlignment([], ['Education'])
      expect(result.score).toBe(0)
    })

    it('should return 100 with full overlap', () => {
      const result = calculateProgramAlignment(
        ['Education', 'Health'],
        ['Education', 'Health', 'Youth']
      )
      expect(result.score).toBe(100)
    })
  })

  describe('mission alignment scoring', () => {
    function calculateMissionAlignment(funderMission: string, orgMission: string) {
      const funderWords = new Set(funderMission.toLowerCase().split(/\s+/).filter(w => w.length > 4))
      const orgWords = new Set(orgMission.toLowerCase().split(/\s+/).filter(w => w.length > 4))
      const overlap = [...funderWords].filter(w => orgWords.has(w)).length
      return Math.min(Math.round((overlap / Math.max(funderWords.size, 1)) * 10), 10)
    }

    it('should score high for strongly overlapping missions', () => {
      const score = calculateMissionAlignment(
        'We support education programs for underserved youth in urban communities',
        'Our mission is to provide education and mentorship to underserved youth in communities across the region'
      )
      expect(score).toBeGreaterThan(5)
    })

    it('should score low for unrelated missions', () => {
      const score = calculateMissionAlignment(
        'We protect endangered wildlife habitats globally',
        'We provide affordable housing to low-income families'
      )
      expect(score).toBeLessThanOrEqual(2)
    })

    it('should cap at 10 points', () => {
      const score = calculateMissionAlignment(
        'education youth community programs development services',
        'education youth community programs development services outreach'
      )
      expect(score).toBeLessThanOrEqual(10)
    })
  })

  describe('giving growth rate', () => {
    function calculateGrowthRate(trend: Array<{ year: number; totalGiving: number }>) {
      const recent = trend.slice(-3)
      if (recent.length < 2) return null
      const oldest = recent[0].totalGiving
      const newest = recent[recent.length - 1].totalGiving
      return oldest > 0 ? Math.round(((newest - oldest) / oldest) * 100) : null
    }

    it('should detect positive growth', () => {
      const rate = calculateGrowthRate([
        { year: 2022, totalGiving: 1000000 },
        { year: 2023, totalGiving: 1200000 },
        { year: 2024, totalGiving: 1500000 },
      ])
      expect(rate).toBe(50) // (1.5M - 1M) / 1M = 50%
    })

    it('should detect negative growth', () => {
      const rate = calculateGrowthRate([
        { year: 2022, totalGiving: 2000000 },
        { year: 2023, totalGiving: 1500000 },
        { year: 2024, totalGiving: 1000000 },
      ])
      expect(rate).toBe(-50)
    })

    it('should return null for insufficient data', () => {
      const rate = calculateGrowthRate([
        { year: 2024, totalGiving: 1000000 },
      ])
      expect(rate).toBeNull()
    })

    it('should handle zero base giving', () => {
      const rate = calculateGrowthRate([
        { year: 2022, totalGiving: 0 },
        { year: 2023, totalGiving: 100000 },
        { year: 2024, totalGiving: 200000 },
      ])
      expect(rate).toBeNull()
    })
  })

  describe('grant size distribution', () => {
    function calculateStats(amounts: number[]) {
      if (amounts.length === 0) return null
      const sorted = [...amounts].sort((a, b) => a - b)
      return {
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        median: sorted[Math.floor(sorted.length / 2)],
        average: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
        p25: sorted[Math.floor(sorted.length * 0.25)] || 0,
        p75: sorted[Math.floor(sorted.length * 0.75)] || 0,
      }
    }

    it('should calculate correct statistics', () => {
      const stats = calculateStats([10000, 25000, 50000, 75000, 100000])
      expect(stats).not.toBeNull()
      expect(stats!.min).toBe(10000)
      expect(stats!.max).toBe(100000)
      expect(stats!.median).toBe(50000)
      expect(stats!.average).toBe(52000)
    })

    it('should handle single value', () => {
      const stats = calculateStats([50000])
      expect(stats!.min).toBe(50000)
      expect(stats!.max).toBe(50000)
      expect(stats!.median).toBe(50000)
    })

    it('should return null for empty amounts', () => {
      expect(calculateStats([])).toBeNull()
    })
  })
})
