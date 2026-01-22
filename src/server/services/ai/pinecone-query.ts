import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

let _pinecone: Pinecone | null = null;
let _openai: OpenAI | null = null;

function getPinecone(): Pinecone {
  if (!_pinecone) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    _pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _pinecone;
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
  });
  return response.data[0].embedding;
}

export async function queryOrganizationMemory({
  query,
  organizationId,
  topK = 10,
  minScore = 0.7,
}: {
  query: string;
  organizationId: string;
  topK?: number;
  minScore?: number;
}) {
  const queryEmbedding = await generateEmbedding(query);

  const index = getPinecone().index(process.env.PINECONE_INDEX!);
  const namespace = index.namespace(organizationId);

  const results = await namespace.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  // Filter by minimum score (V3 trust threshold)
  const filtered = results.matches
    ?.filter(match => (match.score ?? 0) >= minScore)
    .map(match => ({
      id: match.id,
      score: match.score ?? 0,
      documentId: match.metadata?.documentId as string,
      documentName: match.metadata?.documentName as string,
      documentType: match.metadata?.documentType as string,
      text: match.metadata?.text as string,
      chunkIndex: match.metadata?.chunkIndex as number,
    })) ?? [];

  return {
    results: filtered,
    averageScore: filtered.length > 0
      ? filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length
      : 0,
  };
}

export function calculateConfidence(averageScore: number): {
  level: 'high' | 'medium' | 'low';
  score: number;
  shouldGenerate: boolean;
} {
  const score = Math.round(averageScore * 100);

  if (score >= 80) {
    return { level: 'high', score, shouldGenerate: true };
  } else if (score >= 60) {
    return { level: 'medium', score, shouldGenerate: true };
  } else {
    return { level: 'low', score, shouldGenerate: false };
  }
}
