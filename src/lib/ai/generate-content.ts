import { anthropic } from '@/lib/anthropic'
import { confidenceScoring } from '@/server/services/ai/confidence-scoring'
import type { VoiceProfile } from '@/server/services/ai/voice-analyzer'
import type { RAGContext } from '@/server/services/ai/rag'
import type { SourceDocument } from '@/types/confidence'

export interface GenerateGrantContentInput {
  grantId: string
  sectionId: string
  prompt: string
  existingContent?: string
  memoryContext: RAGContext[]
  funderContext?: {
    name: string
    mission?: string
    priorities?: string[]
    pastAwards?: string[]
    requirements?: string[]
  }
  voiceProfile?: VoiceProfile
  sectionName?: string
  wordLimit?: number
}

export interface GenerateGrantContentResult {
  content: string
  confidenceScore: number
  sourcesUsed: Array<{
    documentId: string
    documentName: string
    chunkIndex: number
  }>
}

/**
 * Generate grant content using Claude API with organizational memory and context
 */
export async function generateGrantContent({
  grantId,
  sectionId,
  prompt,
  existingContent,
  memoryContext,
  funderContext,
  voiceProfile,
  sectionName = 'this section',
  wordLimit,
}: GenerateGrantContentInput): Promise<GenerateGrantContentResult> {
  // Build funder context section
  const funderContextText = funderContext
    ? `
FUNDER CONTEXT:
Funder: ${funderContext.name}
${funderContext.mission ? `Mission: ${funderContext.mission}` : ''}
${funderContext.priorities?.length ? `Priorities: ${funderContext.priorities.join(', ')}` : ''}
${funderContext.pastAwards?.length ? `Past Awards: ${funderContext.pastAwards.join('; ')}` : ''}
${funderContext.requirements?.length ? `Requirements: ${funderContext.requirements.join('; ')}` : ''}
`.trim()
    : ''

  // Build voice profile section
  const voiceProfileText = voiceProfile
    ? `
VOICE PROFILE:
Write in the organization's established voice:
- Formality: ${voiceProfile.tone.formality}/100 (${voiceProfile.tone.formality >= 70 ? 'formal' : voiceProfile.tone.formality >= 40 ? 'balanced' : 'conversational'})
- Directness: ${voiceProfile.tone.directness}/100 (${voiceProfile.tone.directness >= 70 ? 'direct and clear' : voiceProfile.tone.directness >= 40 ? 'moderately direct' : 'nuanced'})
- Data Emphasis: ${voiceProfile.tone.dataEmphasis}/100 (${voiceProfile.tone.dataEmphasis >= 70 ? 'heavily data-driven' : voiceProfile.tone.dataEmphasis >= 40 ? 'balanced use of data' : 'narrative-focused'})
- Sentence length: Average ${voiceProfile.sentencePatterns.avgLength} words
- Preferred terms: ${Object.entries(voiceProfile.vocabulary.preferredTerms).map(([wrong, right]) => `use "${right}" not "${wrong}"`).slice(0, 5).join(', ')}
- Avoid these terms: ${voiceProfile.vocabulary.avoidedTerms.slice(0, 5).join(', ')}
`.trim()
    : 'Voice Profile: Professional, clear, data-driven'

  // Build memory context section with source attribution
  const memoryContextText =
    memoryContext.length > 0
      ? memoryContext
          .map(
            (ctx, i) =>
              `[Source ${i + 1}: ${ctx.documentName}, chunk ${ctx.chunkIndex}, relevance: ${Math.round(ctx.score * 100)}%]
${ctx.text}`
          )
          .join('\n\n---\n\n')
      : 'No relevant organizational content found. Write based on general best practices for this type of content.'

  // Build existing content section
  const existingContentText = existingContent
    ? `
EXISTING CONTENT TO CONTINUE/IMPROVE:
${existingContent}
`.trim()
    : ''

  // Build word limit guidance
  const wordLimitText = wordLimit ? `Target length: approximately ${wordLimit} words.` : ''

  // Construct system prompt
  const systemPrompt = `You are an expert grant writer. Generate content for the ${sectionName} section of a grant proposal.

${funderContextText}

${voiceProfileText}

CRITICAL RULES:
1. ONLY use information from the provided organizational sources below
2. Do not invent statistics, dates, programs, or facts
3. Every claim should be traceable to the source documents
4. If sources don't contain relevant information for a specific point, acknowledge the limitation
5. Match the organization's writing style and voice
6. Cite specific data points, outcomes, and examples from the sources
7. ${wordLimitText}
8. Be specific and concrete - avoid vague generalizations

Your goal is to create compelling, evidence-based grant content that authentically represents this organization's work and voice.`.trim()

  // Construct user prompt
  const userPrompt = `ORGANIZATIONAL MEMORY SOURCES:

${memoryContextText}

---

${existingContentText}

${existingContentText ? '---\n' : ''}

USER REQUEST:
${prompt}

Generate the requested content using ONLY information from the sources above. Ensure it matches the organization's voice and addresses the funder's priorities.`.trim()

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Extract content
  const content = response.content[0].type === 'text' ? response.content[0].text : ''

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore({
    memoryContextCount: memoryContext.length,
    avgContextScore: memoryContext.length > 0
      ? memoryContext.reduce((sum, ctx) => sum + ctx.score, 0) / memoryContext.length
      : 0,
    hasFunderContext: !!funderContext,
    hasVoiceProfile: !!voiceProfile,
    hasExistingContent: !!existingContent,
    contentLength: content.length,
    wordLimit,
  })

  // Extract sources used
  const sourcesUsed = memoryContext.map((ctx) => ({
    documentId: ctx.documentId,
    documentName: ctx.documentName,
    chunkIndex: ctx.chunkIndex,
  }))

  return {
    content,
    confidenceScore,
    sourcesUsed,
  }
}

/**
 * Calculate confidence score for generated content
 * Based on quality and quantity of available context
 */
function calculateConfidenceScore(params: {
  memoryContextCount: number
  avgContextScore: number
  hasFunderContext: boolean
  hasVoiceProfile: boolean
  hasExistingContent: boolean
  contentLength: number
  wordLimit?: number
}): number {
  let score = 50 // Base score

  // Memory context quality (0-30 points)
  if (params.memoryContextCount === 0) {
    score -= 30 // No context is a major penalty
  } else {
    // Points for quantity of sources
    const quantityScore = Math.min(params.memoryContextCount / 10, 1) * 15
    score += quantityScore

    // Points for quality (average relevance score)
    const qualityScore = params.avgContextScore * 15
    score += qualityScore
  }

  // Funder context (0-20 points)
  if (params.hasFunderContext) {
    score += 20
  }

  // Voice profile (0-15 points)
  if (params.hasVoiceProfile) {
    score += 15
  }

  // Existing content to build on (0-10 points)
  if (params.hasExistingContent) {
    score += 10
  }

  // Content length appropriateness (0-15 points)
  if (params.wordLimit) {
    const estimatedWords = params.contentLength / 5 // Rough estimate: 5 chars per word
    const lengthRatio = estimatedWords / params.wordLimit

    if (lengthRatio >= 0.7 && lengthRatio <= 1.3) {
      score += 15 // Good length
    } else if (lengthRatio >= 0.5 && lengthRatio <= 1.5) {
      score += 10 // Acceptable length
    } else if (lengthRatio >= 0.3 && lengthRatio <= 2.0) {
      score += 5 // Marginal length
    }
    // else: no points for poor length matching
  } else {
    // No word limit specified, give moderate points if content exists
    if (params.contentLength > 100) {
      score += 10
    }
  }

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(score)))
}
