import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface GenerationInput {
  prompt: string;
  context: Array<{ text: string; documentName: string; score: number }>;
  mode: 'memory_assist' | 'ai_draft' | 'human_first';
  voiceProfile?: any; // Organization's voice profile for tone matching
}

export async function generateGrantContent({
  prompt,
  context,
  mode,
  voiceProfile,
}: GenerationInput): Promise<string> {

  // Build context string with source attribution
  const contextText = context
    .map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.text}`)
    .join('\n\n---\n\n');

  // Mode-specific instructions
  const modeInstructions = {
    memory_assist: `You are helping adapt existing content. Prioritize reusing the exact language from the sources where appropriate. Make minimal changes to fit the new context.`,
    ai_draft: `You are drafting new content based on the organization's past work. Match their writing style and voice. Create original content that sounds like them.`,
    human_first: `You are suggesting edits and improvements only. Do not write new content. Provide specific suggestions the human can implement.`,
  };

  // Voice profile instructions
  const voiceInstructions = voiceProfile ? `
Voice Profile:
- Formality: ${voiceProfile.tone?.formality ?? 70}/100
- Directness: ${voiceProfile.tone?.directness ?? 60}/100
- Preferred terms: ${JSON.stringify(voiceProfile.vocabulary?.preferredTerms ?? {})}
- Avoid: ${(voiceProfile.vocabulary?.avoidedTerms ?? []).join(', ')}
` : '';

  const systemPrompt = `You are a grant writing assistant for a nonprofit organization.

${modeInstructions[mode]}

${voiceInstructions}

CRITICAL RULES:
1. ONLY use information from the provided sources
2. Do not invent statistics, dates, or facts
3. Every claim should be traceable to the source documents
4. If the sources don't contain relevant information, say so clearly
5. Match the organization's writing style from the examples`;

  const userPrompt = `SOURCES FROM ORGANIZATIONAL MEMORY:

${contextText}

---

USER REQUEST:
${prompt}

Write the requested content using ONLY information from the sources above.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
