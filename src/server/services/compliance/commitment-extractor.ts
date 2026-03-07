import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/server/db';
import { CommitmentType } from '@prisma/client';

const anthropic = new Anthropic();

interface ExtractedCommitment {
  type: CommitmentType;
  description: string;
  metricName?: string;
  metricValue?: string;
  dueDate?: string;
  sourceText: string;
  confidence: number;
}

export async function extractCommitmentsFromDocument(
  documentId: string,
  grantId: string
): Promise<ExtractedCommitment[]> {

  const document = await db.document.findUnique({
    where: { id: documentId },
    include: { grant: { include: { organization: true } } }
  });

  if (!document?.extractedText) {
    throw new Error('Document has no extracted text');
  }

  const prompt = `Analyze this grant document and extract ALL commitments and promises made.

For each commitment, identify:
1. Type: DELIVERABLE, OUTCOME_METRIC, REPORT_DUE, BUDGET_SPEND, STAFFING, TIMELINE
2. Description: Clear statement of what was promised
3. Metric name (if applicable): e.g., "youth served", "meals provided"
4. Metric value (if applicable): e.g., "500", "1,000"
5. Due date (if specified): ISO 8601 format
6. Source text: The EXACT quote from the document containing this commitment
7. Confidence: 0-100 how certain you are this is a real commitment

Return JSON array:
[
  {
    "type": "OUTCOME_METRIC",
    "description": "Serve 500 youth annually through after-school programs",
    "metricName": "youth served",
    "metricValue": "500",
    "dueDate": "2025-12-31",
    "sourceText": "We commit to serving 500 youth annually through our after-school programs by the end of the grant period.",
    "confidence": 95
  }
]

IMPORTANT:
- Only extract explicit commitments, not general statements
- Include the exact source text so users can verify
- Be conservative - if unsure, lower the confidence score
- Look for: numbers, deadlines, deliverables, outcomes, staffing promises, budget allocations

Document text:
${document.extractedText.slice(0, 50000)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    console.error('Failed to parse commitments JSON');
    return [];
  }

  const commitments: ExtractedCommitment[] = JSON.parse(jsonMatch[0]);

  // Store in database
  const grant = await db.grant.findUnique({ where: { id: grantId } });

  for (const c of commitments) {
    await db.commitment.create({
      data: {
        organizationId: grant!.organizationId,
        grantId,
        type: c.type,
        description: c.description,
        metricName: c.metricName || null,
        metricValue: c.metricValue || null,
        dueDate: c.dueDate ? new Date(c.dueDate) : null,
        sourceText: c.sourceText,
        sourceDocumentId: documentId,
        confidence: c.confidence,
        extractedBy: 'AI',
        status: 'PENDING'
      }
    });
  }

  return commitments;
}

/**
 * Extract commitments from ad-hoc text (e.g., draft content in Writing Studio)
 * Used for real-time compliance checking during writing.
 * Does NOT persist to database - returns analysis only.
 */
export async function extractCommitmentsFromText(
  text: string,
  grantId: string,
  organizationId: string
): Promise<ExtractedCommitment[]> {
  if (!text || text.trim().length < 50) {
    return []
  }

  const prompt = `Analyze this grant proposal draft text and identify ALL commitments, promises, and quantifiable claims being made.

For each commitment found, identify:
1. Type: DELIVERABLE, OUTCOME_METRIC, REPORT_DUE, BUDGET_SPEND, STAFFING, TIMELINE
2. Description: Clear statement of what is being promised
3. Metric name (if applicable): e.g., "youth served", "meals provided"
4. Metric value (if applicable): e.g., "500", "1,000"
5. Due date (if specified): ISO 8601 format
6. Source text: The EXACT quote from the text containing this commitment
7. Confidence: 0-100 how certain you are this is a real commitment (not hypothetical)

Return JSON array:
[
  {
    "type": "OUTCOME_METRIC",
    "description": "Serve 500 youth annually",
    "metricName": "youth served",
    "metricValue": "500",
    "dueDate": null,
    "sourceText": "We will serve 500 youth annually through our programs.",
    "confidence": 85
  }
]

IMPORTANT:
- Only extract EXPLICIT commitments, not aspirational or hypothetical language
- Include the exact source text so users can verify
- Be conservative with confidence scores
- Look for: specific numbers, dates, deliverables, outcomes, staffing promises, budget commitments
- If no commitments found, return an empty array []

Draft text:
${text.slice(0, 30000)}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return [];
    }

    const commitments: ExtractedCommitment[] = JSON.parse(jsonMatch[0]);
    return commitments;
  } catch (error) {
    console.error('[extractCommitmentsFromText] Error:', error);
    return [];
  }
}
