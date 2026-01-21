import { anthropic } from './anthropic'
import { prisma } from './prisma'
import { getIndex } from './pinecone'
import type { Organization, Opportunity, Document } from '@prisma/client'

/**
 * Result from fit score calculation
 */
export interface FitScoreResult {
  overallScore: number
  missionScore: number
  capacityScore: number
  geographicScore: number
  historyScore: number
  estimatedHours: number
  reusableContent: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    relevantDocuments: Array<{
      id: string
      name: string
      type: string
      relevance: string
    }>
  }
}

/**
 * Calculate fit score for an opportunity
 */
export async function calculateFitScore(
  opportunityId: string,
  organizationId: string
): Promise<FitScoreResult> {
  // Fetch opportunity details
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      funder: true,
    },
  })

  if (!opportunity) {
    throw new Error('Opportunity not found')
  }

  // Fetch organization details
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Fetch organization's documents for context
  const documents = await prisma.document.findMany({
    where: {
      organizationId,
      status: 'COMPLETED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  // Fetch organization's past grants for historical context
  const pastGrants = await prisma.grant.findMany({
    where: {
      organizationId,
      status: {
        in: ['AWARDED', 'COMPLETED'],
      },
    },
    include: {
      opportunity: true,
      funder: true,
    },
    orderBy: {
      awardedAt: 'desc',
    },
    take: 5,
  })

  // Query Pinecone for relevant content
  let relevantContent: Array<{ id: string; name: string; type: string; score: number }> = []
  const index = getIndex()

  if (index && opportunity.description) {
    try {
      // Create embedding for opportunity description
      // Note: In production, you'd want to use a proper embedding model
      // For now, we'll use Claude to find relevant documents through other means
      const docIds = documents.map(d => d.id)
      relevantContent = documents
        .map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          score: 0.8, // Placeholder - would come from vector similarity
        }))
        .slice(0, 5)
    } catch (error) {
      console.warn('Failed to query Pinecone for relevant content:', error)
    }
  }

  // Use Claude to analyze fit
  const prompt = buildFitAnalysisPrompt(
    opportunity,
    organization,
    documents,
    pastGrants,
    relevantContent
  )

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  // Parse Claude's response
  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  const result = parseClaudeResponse(content.text, documents)

  return result
}

/**
 * Build prompt for Claude to analyze fit
 */
function buildFitAnalysisPrompt(
  opportunity: Opportunity & { funder: any },
  organization: Organization,
  documents: Document[],
  pastGrants: any[],
  relevantContent: Array<{ id: string; name: string; type: string; score: number }>
): string {
  return `You are analyzing how well a grant opportunity fits an organization. Provide a detailed fit analysis with specific scores and actionable insights.

# Organization Profile
Name: ${organization.name}
${organization.ein ? `EIN: ${organization.ein}` : ''}
${organization.mission ? `Mission: ${organization.mission}` : 'Mission: Not provided'}

# Organization Documents
The organization has ${documents.length} documents in their repository:
${documents.map(d => `- ${d.name} (${d.type})`).join('\n')}

# Past Grant Success
The organization has been awarded ${pastGrants.length} grants:
${pastGrants.map(g => `- ${g.opportunity?.title || 'Unknown'} from ${g.funder?.name || 'Unknown funder'} - $${g.amountAwarded || 'Unknown'}`).join('\n')}

# Opportunity Details
Title: ${opportunity.title}
${opportunity.description ? `Description: ${opportunity.description}` : ''}
${opportunity.amountMin && opportunity.amountMax ? `Amount Range: $${opportunity.amountMin} - $${opportunity.amountMax}` : ''}
${opportunity.deadline ? `Deadline: ${opportunity.deadline.toISOString()}` : 'Deadline: Rolling'}
${opportunity.funder ? `Funder: ${opportunity.funder.name}` : ''}

${opportunity.requirements ? `Requirements: ${JSON.stringify(opportunity.requirements)}` : ''}
${opportunity.eligibility ? `Eligibility: ${JSON.stringify(opportunity.eligibility)}` : ''}

# Your Task
Analyze the fit between this organization and opportunity. Provide your response in the following JSON format:

{
  "overallScore": <0-100>,
  "missionScore": <0-100>,
  "capacityScore": <0-100>,
  "geographicScore": <0-100>,
  "historyScore": <0-100>,
  "estimatedHours": <number of hours to complete application>,
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "concerns": [
    "<specific concern 1>",
    "<specific concern 2>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "relevantDocuments": [
    {
      "documentName": "<document name from the list above>",
      "relevance": "<why this document is relevant>"
    }
  ]
}

Scoring criteria:
- missionScore: Alignment between org mission and opportunity purpose
- capacityScore: Organization's ability to deliver (budget, staff, experience)
- geographicScore: Geographic alignment if applicable
- historyScore: Past success with similar grants or funders
- overallScore: Weighted average emphasizing mission and capacity

Be specific and actionable. Reference actual documents and past grants when relevant.`
}

/**
 * Parse Claude's response into structured result
 */
function parseClaudeResponse(
  responseText: string,
  documents: Document[]
): FitScoreResult {
  try {
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Map document names to IDs and add document metadata
    const relevantDocs = (parsed.relevantDocuments || []).map((doc: any) => {
      const matchedDoc = documents.find(d =>
        d.name.toLowerCase().includes(doc.documentName?.toLowerCase()) ||
        doc.documentName?.toLowerCase().includes(d.name.toLowerCase())
      )

      return {
        id: matchedDoc?.id || 'unknown',
        name: doc.documentName || 'Unknown',
        type: matchedDoc?.type || 'OTHER',
        relevance: doc.relevance || 'Relevant to application',
      }
    })

    return {
      overallScore: Math.min(100, Math.max(0, parsed.overallScore || 0)),
      missionScore: Math.min(100, Math.max(0, parsed.missionScore || 0)),
      capacityScore: Math.min(100, Math.max(0, parsed.capacityScore || 0)),
      geographicScore: Math.min(100, Math.max(0, parsed.geographicScore || 0)),
      historyScore: Math.min(100, Math.max(0, parsed.historyScore || 0)),
      estimatedHours: Math.max(0, parsed.estimatedHours || 20),
      reusableContent: {
        strengths: parsed.strengths || [],
        concerns: parsed.concerns || [],
        recommendations: parsed.recommendations || [],
        relevantDocuments: relevantDocs,
      },
    }
  } catch (error) {
    console.error('Failed to parse Claude response:', error)
    console.error('Response text:', responseText)

    // Return default scores if parsing fails
    return {
      overallScore: 50,
      missionScore: 50,
      capacityScore: 50,
      geographicScore: 50,
      historyScore: 50,
      estimatedHours: 30,
      reusableContent: {
        strengths: ['Unable to analyze - parsing error'],
        concerns: ['Analysis failed - please try again'],
        recommendations: ['Re-run fit analysis'],
        relevantDocuments: [],
      },
    }
  }
}

/**
 * Get or calculate fit score with caching
 */
export async function getOrCalculateFitScore(
  opportunityId: string,
  organizationId: string,
  maxAgeHours: number = 24
): Promise<FitScoreResult & { fromCache: boolean }> {
  // Check for existing score
  const existingScore = await prisma.fitScore.findUnique({
    where: {
      opportunityId_organizationId: {
        opportunityId,
        organizationId,
      },
    },
  })

  // Return cached score if recent enough
  if (existingScore) {
    const ageInHours =
      (Date.now() - existingScore.updatedAt.getTime()) / (1000 * 60 * 60)

    if (ageInHours < maxAgeHours) {
      return {
        overallScore: existingScore.overallScore,
        missionScore: existingScore.missionScore,
        capacityScore: existingScore.capacityScore,
        geographicScore: existingScore.geographicScore,
        historyScore: existingScore.historyScore,
        estimatedHours: existingScore.estimatedHours || 30,
        reusableContent: existingScore.reusableContent as any || {
          strengths: [],
          concerns: [],
          recommendations: [],
          relevantDocuments: [],
        },
        fromCache: true,
      }
    }
  }

  // Calculate new score
  const result = await calculateFitScore(opportunityId, organizationId)

  // Store in database
  await prisma.fitScore.upsert({
    where: {
      opportunityId_organizationId: {
        opportunityId,
        organizationId,
      },
    },
    create: {
      opportunityId,
      organizationId,
      overallScore: result.overallScore,
      missionScore: result.missionScore,
      capacityScore: result.capacityScore,
      geographicScore: result.geographicScore,
      historyScore: result.historyScore,
      estimatedHours: result.estimatedHours,
      reusableContent: result.reusableContent,
    },
    update: {
      overallScore: result.overallScore,
      missionScore: result.missionScore,
      capacityScore: result.capacityScore,
      geographicScore: result.geographicScore,
      historyScore: result.historyScore,
      estimatedHours: result.estimatedHours,
      reusableContent: result.reusableContent,
    },
  })

  return {
    ...result,
    fromCache: false,
  }
}
