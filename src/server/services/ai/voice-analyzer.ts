import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

/**
 * Voice profile structure returned by Claude
 */
export interface VoiceProfile {
  sentencePatterns: {
    avgLength: number;
    shortRatio: number; // % of sentences < 15 words
    complexRatio: number; // % of sentences with clauses
  };
  vocabulary: {
    preferredTerms: Record<string, string>; // e.g. { "utilize": "use", "leverage": "use" }
    avoidedTerms: string[];
    jargonLevel: number; // 0-100
  };
  tone: {
    formality: number; // 0-100
    directness: number; // 0-100
    optimism: number; // 0-100
    dataEmphasis: number; // 0-100, how much they cite statistics
    urgency: number; // 0-100
    complexity: number; // 0-100, reading level
  };
  patterns: Array<{
    type: 'opening' | 'transition' | 'evidence' | 'closing';
    description: string;
    example: string;
    enabled: boolean;
  }>;
}

/**
 * Analyzes organizational writing samples to extract voice profile
 */
export async function analyzeOrganizationalVoice(
  documentSamples: Array<{ text: string; documentName: string; type: string }>
): Promise<VoiceProfile> {
  if (documentSamples.length === 0) {
    throw new Error('No documents provided for voice analysis');
  }

  // Combine samples with document context
  const samplesText = documentSamples
    .map((doc, i) => `
=== DOCUMENT ${i + 1}: ${doc.documentName} (${doc.type}) ===
${doc.text.substring(0, 5000)} // Limit per document to fit in context
`)
    .join('\n\n');

  const prompt = `You are analyzing the writing voice and style of a nonprofit organization based on their past documents (proposals, reports, etc).

Analyze these writing samples and extract a detailed voice profile:

${samplesText}

Provide your analysis in the following JSON structure:

{
  "sentencePatterns": {
    "avgLength": <number of words>,
    "shortRatio": <0-100, percentage of sentences under 15 words>,
    "complexRatio": <0-100, percentage of sentences with subordinate clauses>
  },
  "vocabulary": {
    "preferredTerms": {
      <identified common word choices, e.g. "utilize": "use" if they prefer "use" over "utilize">
    },
    "avoidedTerms": [
      <words they seem to avoid, e.g. "leverage", "synergy", etc>
    ],
    "jargonLevel": <0-100, how technical/specialized their language is>
  },
  "tone": {
    "formality": <0-100, how formal vs conversational>,
    "directness": <0-100, how direct vs indirect>,
    "optimism": <0-100, how optimistic/positive vs neutral>,
    "dataEmphasis": <0-100, how much they cite statistics and numbers>,
    "urgency": <0-100, how urgent/action-oriented vs reflective>,
    "complexity": <0-100, reading level from simple to complex>
  },
  "patterns": [
    {
      "type": "opening",
      "description": "How they typically start sections or documents",
      "example": "<actual example from the text>",
      "enabled": true
    },
    {
      "type": "transition",
      "description": "How they transition between ideas",
      "example": "<actual example>",
      "enabled": true
    },
    {
      "type": "evidence",
      "description": "How they present evidence and support claims",
      "example": "<actual example>",
      "enabled": true
    },
    {
      "type": "closing",
      "description": "How they conclude sections",
      "example": "<actual example>",
      "enabled": true
    }
  ]
}

Important guidelines:
1. Base ALL analysis on the actual text provided
2. Extract real examples directly from the documents
3. Look for consistent patterns across multiple documents
4. Be specific and quantitative where possible
5. Return ONLY valid JSON, no other text`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.3, // Lower temperature for more consistent analysis
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Parse the JSON response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    const voiceProfile = JSON.parse(jsonText) as VoiceProfile;
    return voiceProfile;
  } catch (error) {
    console.error('Failed to parse voice profile JSON:', jsonText);
    throw new Error('Failed to parse voice profile from Claude response');
  }
}

/**
 * Rewrites sample text using the organization's voice profile
 */
export async function rewriteInOrganizationVoice(
  sampleText: string,
  voiceProfile: VoiceProfile
): Promise<{ original: string; rewritten: string; changes: string[] }> {
  const prompt = `You are helping rewrite text to match a specific organization's writing voice and style.

VOICE PROFILE:
- Sentence patterns: ${voiceProfile.sentencePatterns.avgLength} words avg, ${voiceProfile.sentencePatterns.shortRatio}% short sentences
- Vocabulary: Uses terms like ${Object.values(voiceProfile.vocabulary.preferredTerms).slice(0, 5).join(', ')}
- Avoids: ${voiceProfile.vocabulary.avoidedTerms.slice(0, 5).join(', ')}
- Tone:
  * Formality: ${voiceProfile.tone.formality}/100
  * Directness: ${voiceProfile.tone.directness}/100
  * Optimism: ${voiceProfile.tone.optimism}/100
  * Data emphasis: ${voiceProfile.tone.dataEmphasis}/100
  * Urgency: ${voiceProfile.tone.urgency}/100
  * Complexity: ${voiceProfile.tone.complexity}/100

PATTERNS:
${voiceProfile.patterns
  .filter(p => p.enabled)
  .map(p => `- ${p.type}: ${p.description}\n  Example: "${p.example}"`)
  .join('\n')}

ORIGINAL TEXT:
${sampleText}

Rewrite this text to match the organization's voice profile. Then provide a brief list of the key changes you made.

Respond in this JSON format:
{
  "rewritten": "<the rewritten text>",
  "changes": ["<change 1>", "<change 2>", ...]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.5,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    const result = JSON.parse(jsonText) as { rewritten: string; changes: string[] };
    return {
      original: sampleText,
      rewritten: result.rewritten,
      changes: result.changes,
    };
  } catch (error) {
    console.error('Failed to parse rewrite result JSON:', jsonText);
    throw new Error('Failed to parse rewrite result from Claude response');
  }
}

/**
 * Calculate confidence level based on number of documents analyzed
 */
export function calculateConfidence(documentCount: number): 'high' | 'medium' | 'low' {
  if (documentCount >= 15) return 'high';
  if (documentCount >= 8) return 'medium';
  return 'low';
}
