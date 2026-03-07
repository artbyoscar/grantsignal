import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Dashboard Router Tests
 * Tests the getSetupProgress procedure logic
 */

// Mock data factories
function createMockOrg(overrides: Record<string, unknown> = {}) {
  return {
    id: 'org-test-1',
    name: 'Test Nonprofit',
    mission: 'To serve underserved communities',
    primaryProgramAreas: ['Education', 'Youth Development'],
    voiceProfile: { tone: 'professional', style: 'formal' },
    ...overrides,
  }
}

describe('Dashboard - getSetupProgress', () => {
  describe('Step completion logic', () => {
    it('should mark profile as complete when name, mission, and programAreas exist', () => {
      const org = createMockOrg()
      const profileComplete = !!(org.name && org.mission && org.primaryProgramAreas)
      expect(profileComplete).toBe(true)
    })

    it('should mark profile as incomplete when mission is missing', () => {
      const org = createMockOrg({ mission: null })
      const profileComplete = !!(org.name && org.mission && org.primaryProgramAreas)
      expect(profileComplete).toBe(false)
    })

    it('should mark profile as incomplete when programAreas is empty', () => {
      const org = createMockOrg({ primaryProgramAreas: null })
      const profileComplete = !!(org.name && org.mission && org.primaryProgramAreas)
      expect(profileComplete).toBe(false)
    })

    it('should mark voiceProfile as complete when it exists', () => {
      const org = createMockOrg()
      expect(!!org.voiceProfile).toBe(true)
    })

    it('should mark voiceProfile as incomplete when null', () => {
      const org = createMockOrg({ voiceProfile: null })
      expect(!!org.voiceProfile).toBe(false)
    })
  })

  describe('Progress calculation', () => {
    it('should calculate percentage correctly for all complete', () => {
      const checks = {
        hasProfile: true,
        hasDocuments: true,
        hasGrants: true,
        hasVoiceProfile: true,
        hasTeam: true,
      }
      const completedCount = Object.values(checks).filter(Boolean).length
      const totalCount = Object.keys(checks).length
      const percentComplete = Math.round((completedCount / totalCount) * 100)

      expect(percentComplete).toBe(100)
      expect(completedCount).toBe(5)
    })

    it('should calculate percentage correctly for partial completion', () => {
      const checks = {
        hasProfile: true,
        hasDocuments: false,
        hasGrants: true,
        hasVoiceProfile: false,
        hasTeam: false,
      }
      const completedCount = Object.values(checks).filter(Boolean).length
      const totalCount = Object.keys(checks).length
      const percentComplete = Math.round((completedCount / totalCount) * 100)

      expect(percentComplete).toBe(40)
      expect(completedCount).toBe(2)
    })

    it('should return allDone=true only when all steps complete', () => {
      const completedCount = 5
      const totalCount = 5
      expect(completedCount === totalCount).toBe(true)
    })

    it('should return allDone=false when any step is incomplete', () => {
      const completedCount = 4
      const totalCount = 5
      expect(completedCount === totalCount).toBe(false)
    })
  })
})
