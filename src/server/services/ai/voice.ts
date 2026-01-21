import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface SentencePatterns {
  avgLength: number
  shortSentenceRatio: number
  complexSentenceRatio: number
}

export interface Vocabulary {
  preferredTerms: Record<string, string>
  avoidedTerms: string[]
  jargonLevel: 'low' | 'medium' | 'high'
}

export interface Tone {
  formality: number
  directness: number
  optimism: number
  dataEmphasis: number
  urgency: number
  complexity: number
}

export interface VoicePattern {
  type: string
  description: string
  example: string
}

export interface VoiceProfile {
  sentencePatterns: SentencePatterns
  vocabulary: Vocabulary
  tone: Tone
  patterns: VoicePattern[]
}

export interface AnalyzeVoiceDocument {
  text: string
  type: string
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Analyze organization's writing voice from their documents
 * Extracts comprehensive voice characteristics including sentence patterns,
 * vocabulary preferences, tone metrics, and unique patterns
 *
 * @param organizationId - The organization to analyze
 * @param documents - Array of documents with text and type
 * @returns Structured voice profile
 */
export async function analyzeOrganizationVoice(
  organizationId: string,
  documents: AnalyzeVoiceDocument[]
): Promise<VoiceProfile> {
  console.log(`[Voice Analysis] Starting analysis for organization: ${organizationId}`)
  console.log(`[Voice Analysis] Analyzing ${documents.length} documents`)

  try {
    // Step 1: Validate inputs
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for voice analysis')
    }

    // Step 2: Combine document texts (limit to ~50k tokens = ~200k chars)
    // Taking first 20 documents, 3000 chars each = ~60k chars = ~15k tokens per doc
    const sampleText = documents
      .slice(0, 20)
      .map((d) => d.text.slice(0, 3000))
      .join('\n\n---\n\n')

    console.log(`[Voice Analysis] Sample text length: ${sampleText.length} characters`)

    // Step 3: Call Claude API for voice analysis
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent analysis
      messages: [
        {
          role: 'user',
          content: buildVoiceAnalysisPrompt(sampleText),
        },
      ],
    })

    // Step 4: Extract and parse the JSON response
    const content =
      response.content[0].type === 'text' ? response.content[0].text : ''

    console.log(`[Voice Analysis] Received response from Claude`)

    const voiceProfile = parseVoiceAnalysisResponse(content)

    // Step 5: Store in database
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        voiceProfile: voiceProfile as any, // Prisma Json type
        voiceUpdatedAt: new Date(),
      },
    })

    console.log(`[Voice Analysis] Voice profile saved to database`)

    // Step 6: Return structured profile
    return voiceProfile
  } catch (error) {
    console.error('[Voice Analysis] Analysis failed:', error)

    // Handle specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string }
      if (apiError.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      }
      if (apiError.status === 401) {
        throw new Error('Invalid API key. Please check configuration.')
      }
    }

    throw new Error(
      `Failed to analyze organization voice: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Rewrite text to match organization's voice profile
 * Takes generic text and adapts it to the organization's unique writing style
 * Used for side-by-side comparison demos and voice-matching rewrites
 *
 * @param text - The text to rewrite
 * @param voiceProfile - The target voice profile to match
 * @returns Rewritten text matching the voice profile
 */
export async function rewriteInVoice(
  text: string,
  voiceProfile: VoiceProfile
): Promise<string> {
  console.log(`[Voice Rewrite] Starting rewrite (${text.length} characters)`)

  try {
    // Step 1: Validate inputs
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for rewriting')
    }

    if (!voiceProfile) {
      throw new Error('No voice profile provided')
    }

    // Step 2: Build the rewrite prompt with voice characteristics
    const prompt = buildVoiceRewritePrompt(text, voiceProfile)

    // Step 3: Call Claude API for rewriting
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7, // Higher temperature for more natural writing
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Step 4: Extract the rewritten text
    const rewrittenText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    console.log(
      `[Voice Rewrite] Rewrite complete (${rewrittenText.length} characters)`
    )

    return rewrittenText.trim()
  } catch (error) {
    console.error('[Voice Rewrite] Rewrite failed:', error)

    // Handle specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string }
      if (apiError.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.')
      }
      if (apiError.status === 401) {
        throw new Error('Invalid API key. Please check configuration.')
      }
    }

    throw new Error(
      `Failed to rewrite text: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get organization's voice profile from database
 * Returns null if no profile exists yet
 *
 * @param organizationId - The organization ID
 * @returns Voice profile or null
 */
export async function getOrganizationVoice(
  organizationId: string
): Promise<VoiceProfile | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        voiceProfile: true,
        voiceUpdatedAt: true,
      },
    })

    if (!org?.voiceProfile) {
      return null
    }

    return org.voiceProfile as VoiceProfile
  } catch (error) {
    console.error('[Voice] Failed to get voice profile:', error)
    throw new Error(
      `Failed to retrieve voice profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build the voice analysis prompt for Claude
 */
function buildVoiceAnalysisPrompt(sampleText: string): string {
  return `Analyze the writing style of these nonprofit grant documents.

Documents:
${sampleText}

Return a JSON analysis with this exact structure:
{
  "sentencePatterns": {
    "avgLength": <number 5-30>,
    "shortSentenceRatio": <0-1>,
    "complexSentenceRatio": <0-1>
  },
  "vocabulary": {
    "preferredTerms": {
      "<common term>": "<org's preferred alternative>",
      // e.g., "homeless": "unhoused neighbors"
    },
    "avoidedTerms": ["<term1>", "<term2>"],
    "jargonLevel": "low" | "medium" | "high"
  },
  "tone": {
    "formality": <0-100>,
    "directness": <0-100>,
    "optimism": <0-100>,
    "dataEmphasis": <0-100>,
    "urgency": <0-100>,
    "complexity": <0-100>
  },
  "patterns": [
    {
      "type": "<pattern type>",
      "description": "<what the org does>",
      "example": "<quote from their writing>"
    }
  ]
}

Guidelines for analysis:
- sentencePatterns.avgLength: Average words per sentence (5-30)
- sentencePatterns.shortSentenceRatio: Fraction of sentences with <10 words (0-1)
- sentencePatterns.complexSentenceRatio: Fraction with multiple clauses (0-1)
- vocabulary.preferredTerms: Map common terms to org's preferred alternatives
- vocabulary.avoidedTerms: Terms the org consciously avoids or never uses
- vocabulary.jargonLevel: low = accessible, medium = some technical terms, high = specialized
- tone metrics: 0 = low/minimal, 100 = high/maximum
- patterns: Recurring writing patterns with concrete examples from the text

Be specific about the organization's unique voice characteristics.
Return ONLY the JSON object, no additional text.`
}

/**
 * Build the voice rewrite prompt for Claude
 */
function buildVoiceRewritePrompt(
  text: string,
  voiceProfile: VoiceProfile
): string {
  const { sentencePatterns, vocabulary, tone, patterns } = voiceProfile

  return `Rewrite the following text to match this organization's writing voice.

ORIGINAL TEXT:
${text}

VOICE PROFILE TO MATCH:

Sentence Patterns:
- Average sentence length: ${sentencePatterns.avgLength} words
- Short sentence ratio: ${(sentencePatterns.shortSentenceRatio * 100).toFixed(0)}%
- Complex sentence ratio: ${(sentencePatterns.complexSentenceRatio * 100).toFixed(0)}%

Vocabulary:
- Jargon level: ${vocabulary.jargonLevel}
- Preferred terms: ${Object.entries(vocabulary.preferredTerms)
    .map(([k, v]) => `"${k}" → "${v}"`)
    .join(', ')}
- Avoided terms: ${vocabulary.avoidedTerms.join(', ')}

Tone (0-100 scale):
- Formality: ${tone.formality}
- Directness: ${tone.directness}
- Optimism: ${tone.optimism}
- Data emphasis: ${tone.dataEmphasis}
- Urgency: ${tone.urgency}
- Complexity: ${tone.complexity}

Writing Patterns:
${patterns.map((p) => `- ${p.type}: ${p.description}\n  Example: "${p.example}"`).join('\n')}

INSTRUCTIONS:
1. Preserve the core meaning and key information
2. Match the sentence structure patterns (avg length, short/complex ratios)
3. Use the preferred terminology consistently
4. Avoid the listed avoided terms
5. Match the tone metrics across all dimensions
6. Incorporate the identified writing patterns where appropriate
7. Maintain the organization's unique voice characteristics

Return ONLY the rewritten text, no preamble or meta-commentary.`
}

/**
 * Parse and validate Claude's voice analysis response
 */
function parseVoiceAnalysisResponse(content: string): VoiceProfile {
  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonString = content.trim()

    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(jsonString)

    // Validate structure
    if (!parsed.sentencePatterns || !parsed.vocabulary || !parsed.tone || !parsed.patterns) {
      throw new Error('Missing required voice profile fields')
    }

    // Validate sentencePatterns
    if (
      typeof parsed.sentencePatterns.avgLength !== 'number' ||
      typeof parsed.sentencePatterns.shortSentenceRatio !== 'number' ||
      typeof parsed.sentencePatterns.complexSentenceRatio !== 'number'
    ) {
      throw new Error('Invalid sentencePatterns structure')
    }

    // Validate vocabulary
    if (
      typeof parsed.vocabulary.preferredTerms !== 'object' ||
      !Array.isArray(parsed.vocabulary.avoidedTerms) ||
      !['low', 'medium', 'high'].includes(parsed.vocabulary.jargonLevel)
    ) {
      throw new Error('Invalid vocabulary structure')
    }

    // Validate tone
    const toneFields = ['formality', 'directness', 'optimism', 'dataEmphasis', 'urgency', 'complexity']
    for (const field of toneFields) {
      if (typeof parsed.tone[field] !== 'number' || parsed.tone[field] < 0 || parsed.tone[field] > 100) {
        throw new Error(`Invalid tone.${field} value`)
      }
    }

    // Validate patterns
    if (!Array.isArray(parsed.patterns)) {
      throw new Error('Invalid patterns structure')
    }

    for (const pattern of parsed.patterns) {
      if (!pattern.type || !pattern.description || !pattern.example) {
        throw new Error('Invalid pattern structure')
      }
    }

    return parsed as VoiceProfile
  } catch (error) {
    console.error('[Voice Analysis] Failed to parse response:', error)
    console.error('[Voice Analysis] Raw content:', content)
    throw new Error(
      `Failed to parse voice analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
