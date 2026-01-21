import { anthropic } from '@/lib/anthropic'
import { queryOrganizationMemory, type RAGContext } from './rag'

export interface GenerateWithMemoryOptions {
  prompt: string
  organizationId: string
  grantId?: string
  mode: 'generate' | 'refine' | 'expand'
  existingContent?: string
}

export interface GenerateWithMemoryResult {
  content: string
  sources: Array<{
    documentId: string
    documentName: string
    relevance: number
  }>
  confidence: 'high' | 'medium' | 'low'
  confidenceScore: number
  tokensUsed: number
  model: string
}

/**
 * Generate grant writing content using Claude with RAG context
 */
export async function generateWithMemory(
  options: GenerateWithMemoryOptions
): Promise<GenerateWithMemoryResult> {
  const { prompt, organizationId, mode, existingContent } = options

  try {
    // Step 1: Query organizational memory for relevant context
    console.log(`[AI Writer] Querying memory for: "${prompt.slice(0, 50)}..."`)

    const contexts = await queryOrganizationMemory({
      query: prompt,
      organizationId,
      topK: 5,
      minScore: 0.65,
    })

    console.log(`[AI Writer] Found ${contexts.length} relevant contexts`)

    // Step 2: Build context string from RAG results
    const contextString =
      contexts.length > 0
        ? contexts
            .map(
              (ctx, idx) =>
                `<source id="${idx + 1}" document="${ctx.documentName}" relevance="${Math.round(ctx.score * 100)}%">
${ctx.text}
</source>`
            )
            .join('\n\n')
        : 'No relevant organizational documents found.'

    // Step 3: Build system prompt based on mode
    const systemPrompt = buildSystemPrompt(mode, contexts.length)

    // Step 4: Build user message
    const userMessage = buildUserMessage({
      mode,
      prompt,
      contextString,
      existingContent,
    })

    // Step 5: Call Claude API
    console.log('[AI Writer] Calling Claude API...')
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    // Step 6: Extract content from response
    const content =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Step 7: Calculate confidence score
    const confidenceScore = calculateConfidence({
      contextsFound: contexts.length,
      contextsUsed: contexts.length,
      averageRelevance:
        contexts.reduce((sum, ctx) => sum + ctx.score, 0) / contexts.length ||
        0,
    })

    const confidence = getConfidenceLevel(confidenceScore)

    // Step 8: Format sources
    const sources = contexts.map((ctx) => ({
      documentId: ctx.documentId,
      documentName: ctx.documentName,
      relevance: Math.round(ctx.score * 100),
    }))

    console.log(
      `[AI Writer] Generation complete. Confidence: ${confidence} (${confidenceScore}%)`
    )

    return {
      content,
      sources,
      confidence,
      confidenceScore,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
    }
  } catch (error) {
    console.error('[AI Writer] Generation failed:', error)

    // Handle specific Anthropic errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string }
      if (apiError.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please try again in a moment.'
        )
      }
      if (apiError.status === 401) {
        throw new Error('Invalid API key. Please check configuration.')
      }
    }

    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Build system prompt based on generation mode
 */
function buildSystemPrompt(
  mode: 'generate' | 'refine' | 'expand',
  contextsFound: number
): string {
  const basePrompt = `You are an expert grant writer helping a nonprofit organization create compelling proposal content.

Your task is to ${mode === 'generate' ? 'generate' : mode === 'refine' ? 'refine and improve' : 'expand and elaborate on'} grant proposal content based on the user's request.

${contextsFound > 0 ? `You have access to ${contextsFound} relevant documents from the organization's memory. Use this information to ground your writing in the organization's actual work, mission, and past achievements.` : "No organizational documents were found. Write based on the user's prompt alone."}

Guidelines:
- Write in a clear, professional, and compelling style
- Use specific details from the organizational context when available
- Avoid generic statements; be concrete and evidence-based
- Match the tone and style typical of grant proposals
- Do not make up information not present in the context
- If information is missing, acknowledge it rather than fabricating

${contextsFound === 0 ? 'IMPORTANT: Since no organizational context is available, you should write more generally and suggest areas where specific organizational details should be added.' : ''}

Output only the requested content without preamble or meta-commentary.`

  return basePrompt
}

/**
 * Build user message with context and prompt
 */
function buildUserMessage(options: {
  mode: 'generate' | 'refine' | 'expand'
  prompt: string
  contextString: string
  existingContent?: string
}): string {
  const { mode, prompt, contextString, existingContent } = options

  let message = `# Organizational Context\n\n${contextString}\n\n# Task\n\n${prompt}`

  if (mode === 'refine' && existingContent) {
    message += `\n\n# Existing Content to Refine\n\n${existingContent}`
  } else if (mode === 'expand' && existingContent) {
    message += `\n\n# Content to Expand\n\n${existingContent}`
  }

  return message
}

/**
 * Calculate confidence score based on RAG results
 */
function calculateConfidence(params: {
  contextsFound: number
  contextsUsed: number
  averageRelevance: number
}): number {
  const { contextsFound, contextsUsed, averageRelevance } = params

  // Weighted scoring
  const contextFoundScore = Math.min((contextsFound / 5) * 40, 40) // Max 40 points
  const contextUsedScore = Math.min((contextsUsed / 3) * 30, 30) // Max 30 points
  const relevanceScore = averageRelevance * 30 // Max 30 points

  const total = contextFoundScore + contextUsedScore + relevanceScore

  return Math.round(total)
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}
