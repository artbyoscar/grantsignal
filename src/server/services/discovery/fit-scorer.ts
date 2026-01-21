import { db } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { queryOrganizationMemory } from '../ai/rag'
import type { Organization, Opportunity, Funder, Program, Grant } from '@prisma/client'

const anthropic = new Anthropic()

/**
 * Result of fit score calculation
 */
export interface FitScoreResult {
  overallScore: number // 0-100 weighted average
  missionScore: number // 0-100 mission alignment
  capacityScore: number // 0-100 capacity to deliver
  geographicScore: number // 0-100 geographic fit
  historyScore: number // 0-100 past relationship
  reusableContent: {
    percentage: number // % of sections with existing content
    sections: Array<{
      name: string
      hasReusableContent: boolean
      confidence: number
      suggestedDocuments: string[]
    }>
  }
  estimatedHours: number // Time estimate based on reusable content
  recommendations: string[] // AI-generated tips
}

type OrganizationWithRelations = Organization & {
  programs: Program[]
  grants: Array<Grant & { funder: Funder | null }>
}

type OpportunityWithFunder = Opportunity & {
  funder: Funder | null
}

/**
 * Calculate how well an opportunity matches an organization's capabilities
 */
export async function calculateFitScore(
  opportunityId: string,
  organizationId: string
): Promise<FitScoreResult> {
  // 1. Fetch opportunity and organization data
  const [opportunity, organization] = await Promise.all([
    db.opportunity.findUnique({
      where: { id: opportunityId },
      include: { funder: true },
    }),
    db.organization.findUnique({
      where: { id: organizationId },
      include: {
        programs: true,
        grants: { include: { funder: true } }
      },
    }),
  ])

  if (!opportunity) {
    throw new Error(`Opportunity not found: ${opportunityId}`)
  }

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`)
  }

  // 2. Calculate component scores in parallel
  const [missionScore, capacityScore, geographicScore, historyScore, reusableContent] =
    await Promise.all([
      calculateMissionAlignment(opportunity, organization),
      calculateCapacityMatch(opportunity, organization, organizationId),
      calculateGeographicFit(opportunity, organization),
      calculateHistoryScore(opportunity.funderId, organizationId),
      analyzeReusableContent(opportunity, organizationId),
    ])

  // 3. Weighted average (adjust weights based on importance)
  const overallScore = Math.round(
    missionScore * 0.3 +
      capacityScore * 0.25 +
      geographicScore * 0.15 +
      historyScore * 0.15 +
      reusableContent.percentage * 0.15
  )

  // 4. Estimate completion time
  const baseHours = 40
  const reduction = (reusableContent.percentage / 100) * 0.6
  const estimatedHours = Math.round(baseHours * (1 - reduction))

  // 5. Generate recommendations
  const recommendations = await generateRecommendations({
    missionScore,
    capacityScore,
    geographicScore,
    historyScore,
    reusableContent,
    opportunity,
    organization,
  })

  // 6. Store in database
  await db.fitScore.upsert({
    where: {
      opportunityId_organizationId: {
        opportunityId,
        organizationId,
      },
    },
    update: {
      overallScore,
      missionScore,
      capacityScore,
      geographicScore,
      historyScore,
      reusableContent: reusableContent as any,
      estimatedHours,
    },
    create: {
      opportunityId,
      organizationId,
      overallScore,
      missionScore,
      capacityScore,
      geographicScore,
      historyScore,
      reusableContent: reusableContent as any,
      estimatedHours,
    },
  })

  return {
    overallScore,
    missionScore,
    capacityScore,
    geographicScore,
    historyScore,
    reusableContent,
    estimatedHours,
    recommendations,
  }
}

/**
 * Calculate mission alignment between opportunity and organization
 */
async function calculateMissionAlignment(
  opportunity: OpportunityWithFunder,
  organization: Organization
): Promise<number> {
  try {
    // Build context for Claude
    const opportunityContext = `
Title: ${opportunity.title}
Description: ${opportunity.description || 'Not provided'}
Funder Mission: ${opportunity.funder?.mission || 'Not provided'}
Program Areas: ${opportunity.funder?.programAreas ? JSON.stringify(opportunity.funder.programAreas) : 'Not provided'}
`.trim()

    const organizationContext = `
Name: ${organization.name}
Mission: ${organization.mission || 'Not provided'}
`.trim()

    const prompt = `You are analyzing mission alignment between a grant opportunity and a nonprofit organization.

OPPORTUNITY:
${opportunityContext}

ORGANIZATION:
${organizationContext}

Analyze the alignment between the opportunity's focus areas and the organization's mission. Consider:
1. Keyword overlap between descriptions
2. Program area compatibility
3. Target population or cause alignment
4. Overall thematic fit

Return ONLY a JSON object with this exact structure (no other text):
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation of the score>"
}

Score Guidelines:
- 90-100: Perfect alignment, organization's core mission
- 70-89: Strong alignment, clearly relevant
- 50-69: Moderate alignment, some overlap
- 30-49: Weak alignment, tangential connection
- 0-29: Poor alignment, minimal relevance`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    const result = JSON.parse(jsonText) as { score: number; reasoning: string }

    console.log(`Mission alignment: ${result.score}/100 - ${result.reasoning}`)

    return Math.max(0, Math.min(100, result.score))
  } catch (error) {
    console.error('Error calculating mission alignment:', error)
    // Return neutral score on error
    return 50
  }
}

/**
 * Calculate capacity match based on programs, budget, and existing commitments
 */
async function calculateCapacityMatch(
  opportunity: OpportunityWithFunder,
  organization: OrganizationWithRelations,
  organizationId: string
): Promise<number> {
  let score = 0
  const factors: string[] = []

  // 1. Program match (40 points)
  const hasRelevantPrograms = organization.programs.some(
    (program) => program.isActive && program.description
  )
  if (hasRelevantPrograms) {
    score += 40
    factors.push('Has active programs')
  } else {
    score += 20
    factors.push('Limited program data')
  }

  // 2. Budget alignment (40 points)
  if (opportunity.amountMin || opportunity.amountMax) {
    const opportunityAmount = opportunity.amountMax || opportunity.amountMin || 0
    const typicalGrants = organization.grants
      .filter((g) => g.amountAwarded)
      .map((g) => Number(g.amountAwarded))

    if (typicalGrants.length > 0) {
      const avgGrant =
        typicalGrants.reduce((a, b) => a + b, 0) / typicalGrants.length
      const ratio = Math.min(
        Number(opportunityAmount) / avgGrant,
        avgGrant / Number(opportunityAmount)
      )

      if (ratio >= 0.5) {
        // Within 2x of typical grant size
        score += 40
        factors.push('Grant size matches typical awards')
      } else if (ratio >= 0.25) {
        score += 20
        factors.push('Grant size somewhat matches history')
      } else {
        score += 10
        factors.push('Grant size differs from typical awards')
      }
    } else {
      score += 25
      factors.push('No grant history for comparison')
    }
  } else {
    score += 25
    factors.push('Opportunity amount not specified')
  }

  // 3. Capacity check (20 points)
  // Check for active grants that might indicate workload
  const activeGrants = await db.grant.count({
    where: {
      organizationId,
      status: { in: ['WRITING', 'REVIEW', 'SUBMITTED', 'PENDING'] },
    },
  })

  if (activeGrants === 0) {
    score += 20
    factors.push('Full capacity available')
  } else if (activeGrants <= 3) {
    score += 15
    factors.push('Moderate capacity available')
  } else if (activeGrants <= 6) {
    score += 10
    factors.push('Limited capacity')
  } else {
    score += 5
    factors.push('High workload - many active grants')
  }

  console.log(`Capacity match: ${score}/100 - ${factors.join(', ')}`)

  return score
}

/**
 * Calculate geographic fit between opportunity and organization
 */
async function calculateGeographicFit(
  opportunity: OpportunityWithFunder,
  organization: Organization
): Promise<number> {
  // If no geographic data available, return neutral score
  const funder = opportunity.funder
  if (!funder || (!funder.city && !funder.state && !funder.geographicFocus)) {
    console.log('Geographic fit: 70/100 - No geographic restrictions')
    return 70 // Neutral - assume no restrictions means organization can apply
  }

  // Parse geographic focus from funder
  const geographicFocus = funder.geographicFocus as any
  const funderState = funder.state?.toUpperCase()
  const funderCity = funder.city?.toLowerCase()

  // For now, use a simple heuristic
  // TODO: In production, you'd want to store organization's service area
  // and do more sophisticated geographic matching

  let score = 50 // Start with neutral

  // If funder has specific geographic focus, check against organization's location
  if (geographicFocus) {
    if (Array.isArray(geographicFocus)) {
      // Assume national or multi-state focus
      score = 80
      console.log('Geographic fit: 80/100 - Multi-region funder')
    } else if (typeof geographicFocus === 'object') {
      // Check for national, statewide, or local focus
      if (geographicFocus.scope === 'national') {
        score = 100
        console.log('Geographic fit: 100/100 - National scope')
      } else if (geographicFocus.scope === 'regional') {
        score = 70
        console.log('Geographic fit: 70/100 - Regional scope')
      } else {
        score = 60
        console.log('Geographic fit: 60/100 - Local scope')
      }
    }
  } else if (funderState) {
    // State-level matching would require organization location data
    score = 65
    console.log(`Geographic fit: 65/100 - Funder in ${funderState}`)
  }

  return score
}

/**
 * Calculate history score based on past relationship with funder
 */
async function calculateHistoryScore(
  funderId: string | null,
  organizationId: string
): Promise<number> {
  if (!funderId) {
    console.log('History score: 30/100 - No funder specified')
    return 30 // Neutral for opportunities without specific funder
  }

  // Check for past grants from this funder
  const pastGrants = await db.grant.findMany({
    where: {
      organizationId,
      funderId,
    },
    select: {
      status: true,
      amountAwarded: true,
    },
  })

  if (pastGrants.length === 0) {
    console.log('History score: 30/100 - No history with this funder')
    return 30 // No history
  }

  // Check if any grants were awarded
  const awardedGrants = pastGrants.filter((g) =>
    ['AWARDED', 'ACTIVE', 'COMPLETED'].includes(g.status)
  )

  if (awardedGrants.length > 0) {
    console.log(`History score: 100/100 - ${awardedGrants.length} previous award(s)`)
    return 100 // Previous award = highest history score
  }

  // Previous application but no award
  console.log('History score: 50/100 - Previous application, no award')
  return 50
}

/**
 * Analyze reusable content from organization's document library
 */
async function analyzeReusableContent(
  opportunity: OpportunityWithFunder,
  organizationId: string
): Promise<FitScoreResult['reusableContent']> {
  const sections: Array<{
    name: string
    hasReusableContent: boolean
    confidence: number
    suggestedDocuments: string[]
  }> = []

  // Extract requirements from opportunity
  const requirements = (opportunity.requirements as any) || {}
  const requirementSections = typeof requirements === 'object'
    ? Object.keys(requirements)
    : []

  // Common grant sections if requirements not specified
  const defaultSections = [
    'Executive Summary',
    'Problem Statement',
    'Goals and Objectives',
    'Methods and Strategies',
    'Evaluation Plan',
    'Organizational Capacity',
    'Budget Narrative',
  ]

  const sectionsToAnalyze = requirementSections.length > 0
    ? requirementSections
    : defaultSections

  // Query Pinecone for each section
  for (const sectionName of sectionsToAnalyze) {
    try {
      const query = `${sectionName}: ${opportunity.title} ${opportunity.description || ''}`

      const results = await queryOrganizationMemory({
        query,
        organizationId,
        topK: 3,
        minScore: 0.7,
      })

      const hasReusableContent = results.length > 0
      const avgConfidence = results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 0

      sections.push({
        name: sectionName,
        hasReusableContent,
        confidence: Math.round(avgConfidence * 100),
        suggestedDocuments: [...new Set(results.map((r) => r.documentName))],
      })
    } catch (error) {
      console.error(`Error analyzing section "${sectionName}":`, error)
      // Add section with no reusable content on error
      sections.push({
        name: sectionName,
        hasReusableContent: false,
        confidence: 0,
        suggestedDocuments: [],
      })
    }
  }

  // Calculate percentage of sections with reusable content
  const sectionsWithContent = sections.filter((s) => s.hasReusableContent).length
  const percentage = sections.length > 0
    ? Math.round((sectionsWithContent / sections.length) * 100)
    : 0

  console.log(
    `Reusable content: ${percentage}% (${sectionsWithContent}/${sections.length} sections)`
  )

  return {
    percentage,
    sections,
  }
}

/**
 * Generate actionable recommendations based on scores
 */
async function generateRecommendations(params: {
  missionScore: number
  capacityScore: number
  geographicScore: number
  historyScore: number
  reusableContent: FitScoreResult['reusableContent']
  opportunity: OpportunityWithFunder
  organization: OrganizationWithRelations
}): Promise<string[]> {
  const recommendations: string[] = []

  // Mission score recommendations
  if (params.missionScore < 60) {
    recommendations.push(
      `Consider strengthening the connection between your mission and ${params.opportunity.funder?.name || 'the funder'}'s priorities`
    )
  }

  // Capacity score recommendations
  if (params.capacityScore < 60) {
    if (params.organization.programs.length === 0) {
      recommendations.push(
        'Add program details to your profile to improve capacity matching'
      )
    }
    const activeCount = await db.grant.count({
      where: {
        organizationId: params.organization.id,
        status: { in: ['WRITING', 'REVIEW', 'SUBMITTED', 'PENDING'] },
      },
    })
    if (activeCount > 5) {
      recommendations.push(
        'High workload detected - consider prioritizing applications with higher fit scores'
      )
    }
  }

  // Geographic score recommendations
  if (params.geographicScore < 60 && params.opportunity.funder) {
    recommendations.push(
      `Highlight any connections to ${params.opportunity.funder.state || 'the funder\'s region'} to improve geographic fit`
    )
  }

  // History score recommendations
  if (params.historyScore === 30) {
    recommendations.push(
      'First-time application to this funder - research their giving history and priorities carefully'
    )
  } else if (params.historyScore === 50) {
    recommendations.push(
      'Previous application not awarded - review feedback and strengthen your approach'
    )
  }

  // Reusable content recommendations
  if (params.reusableContent.percentage < 40) {
    recommendations.push(
      'Limited reusable content found - expect significant writing effort for this application'
    )
  } else if (params.reusableContent.percentage >= 70) {
    const topSections = params.reusableContent.sections
      .filter((s) => s.hasReusableContent)
      .slice(0, 3)
      .map((s) => s.name)
    if (topSections.length > 0) {
      recommendations.push(
        `Leverage existing content for: ${topSections.join(', ')}`
      )
    }
  }

  // If we have very few recommendations, add a general positive one
  if (recommendations.length === 0) {
    recommendations.push(
      'Strong overall fit - prioritize this opportunity in your pipeline'
    )
  }

  // Limit to 5 recommendations
  return recommendations.slice(0, 5)
}