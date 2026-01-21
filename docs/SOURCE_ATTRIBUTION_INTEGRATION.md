# Source Attribution Panel - Integration Guide

## Overview

The `SourceAttributionPanel` is a critical trust architecture component that provides **mandatory source attribution** for all AI-generated content in GrantSignal. This ensures compliance with the non-negotiable requirement: "All AI outputs include mandatory source attribution."

## Trust Architecture Alignment

| Confidence | Component Behavior |
|------------|-------------------|
| **≥80%** | Green indicator + SourceAttributionPanel with sources |
| **60-79%** | Amber warning + SourceAttributionPanel with sources |
| **<60%** | No content generated + SourceAttributionPanel for manual review |

## Component Files

```
src/
├── types/
│   └── source.ts                              # TypeScript interfaces
├── components/
│   └── ui/
│       ├── source-attribution-panel.tsx       # Main component
│       └── source-attribution-panel.example.tsx  # Usage examples
```

## Installation

The component is already created in your project. No additional installation needed.

## Basic Usage

```tsx
import { SourceAttributionPanel } from "@/components/ui/source-attribution-panel";
import { Source } from "@/types/source";

function MyComponent() {
  const sources: Source[] = [
    {
      id: "src-1",
      documentId: "doc-123",
      documentName: "Youth Program Proposal 2024.docx",
      documentType: "proposal",
      relevanceScore: 92,
      excerpt: "Our program served 450 participants...",
      pageNumber: 3,
    },
  ];

  return (
    <SourceAttributionPanel
      sources={sources}
      generatedAt={new Date()}
      onSourceClick={(source) => {
        // Handle document opening
        console.log("Open document:", source.documentId);
      }}
      onCopyWithAttribution={() => {
        // Handle copy with attribution
      }}
      defaultExpanded={false}
    />
  );
}
```

## Integration with AI Writing Studio

### Step 1: Update Writing Studio tRPC Router

Add source attribution to your AI generation response:

```typescript
// src/server/routers/writing.ts
import { z } from "zod";

export const writingRouter = createTRPCRouter({
  generateContent: protectedProcedure
    .input(z.object({
      grantId: z.string(),
      sectionId: z.string(),
      prompt: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Query Pinecone for relevant sources
      const vectorResults = await queryVectors(
        input.prompt,
        ctx.user.organizationId
      );

      // 2. Calculate average confidence
      const avgConfidence = calculateConfidence(vectorResults);

      // 3. Map to Source[] format
      const sources = vectorResults.map(result => ({
        id: result.id,
        documentId: result.metadata.documentId,
        documentName: result.metadata.documentName,
        documentType: result.metadata.documentType,
        relevanceScore: Math.round(result.score * 100),
        excerpt: result.metadata.excerpt,
        pageNumber: result.metadata.pageNumber,
      }));

      // 4. Apply confidence gating
      if (avgConfidence < 60) {
        return {
          content: null,
          confidence: avgConfidence,
          sources,
          message: "Cannot confidently adapt content. Review sources manually.",
        };
      }

      // 5. Generate content with Claude
      const generatedContent = await generateWithClaude(
        input.prompt,
        vectorResults
      );

      return {
        content: generatedContent,
        confidence: avgConfidence,
        sources,
        generatedAt: new Date(),
      };
    }),
});
```

### Step 2: Update Writing Studio UI Component

```tsx
// src/components/writing/ai-writer.tsx
"use client";

import { useState } from "react";
import { SourceAttributionPanel } from "@/components/ui/source-attribution-panel";
import { Source } from "@/types/source";
import { trpc } from "@/lib/trpc/client";

export function AIWriter({ grantId, sectionId }: Props) {
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  const generateMutation = trpc.writing.generateContent.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setSources(data.sources);
      setGeneratedAt(data.generatedAt);
      setConfidence(data.confidence);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      grantId,
      sectionId,
      prompt: "Generate program description...",
    });
  };

  const handleSourceClick = (source: Source) => {
    // Open document in modal or new tab
    window.open(`/documents/${source.documentId}`, "_blank");
  };

  const handleCopyWithAttribution = () => {
    const attributionText = sources
      .map((s, i) => `[${i + 1}] ${s.documentName} (${s.relevanceScore}% match)`)
      .join("\n");

    const fullText = `${generatedContent}\n\n---\nSources:\n${attributionText}`;

    navigator.clipboard.writeText(fullText);
    // Show toast notification
  };

  return (
    <div className="space-y-4">
      {/* Confidence Indicator */}
      {confidence > 0 && (
        <div className={cn(
          "flex items-center gap-2 text-sm px-3 py-2 rounded-md",
          confidence >= 80 && "bg-green-50 text-green-700",
          confidence >= 60 && confidence < 80 && "bg-amber-50 text-amber-700",
          confidence < 60 && "bg-red-50 text-red-700"
        )}>
          <div className={cn(
            "h-2 w-2 rounded-full",
            confidence >= 80 && "bg-green-500",
            confidence >= 60 && confidence < 80 && "bg-amber-500",
            confidence < 60 && "bg-red-500"
          )} />
          <span>
            {confidence >= 80 && "High confidence"}
            {confidence >= 60 && confidence < 80 && "Verify accuracy before use"}
            {confidence < 60 && "Cannot confidently adapt content"}
          </span>
        </div>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-gray-700 whitespace-pre-wrap">
            {generatedContent}
          </p>
        </div>
      )}

      {/* Low confidence - show error message */}
      {confidence < 60 && confidence > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Cannot confidently adapt content.</strong> Here are relevant
            sources for manual review:
          </p>
        </div>
      )}

      {/* Mandatory Source Attribution */}
      {sources.length > 0 && generatedAt && (
        <SourceAttributionPanel
          sources={sources}
          generatedAt={generatedAt}
          onSourceClick={handleSourceClick}
          onCopyWithAttribution={handleCopyWithAttribution}
          defaultExpanded={confidence < 80} // Auto-expand for lower confidence
        />
      )}

      <button
        onClick={handleGenerate}
        disabled={generateMutation.isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {generateMutation.isLoading ? "Generating..." : "Generate Content"}
      </button>
    </div>
  );
}
```

## Integration with RAG Pipeline

### Pinecone Metadata Structure

Ensure your Pinecone vectors include required metadata:

```typescript
// src/server/services/ai/embeddings.ts
interface PineconeMetadata {
  documentId: string;
  documentName: string;
  documentType: 'proposal' | 'report' | 'agreement' | 'budget' | 'other';
  organizationId: string;
  excerpt: string; // First 200 characters of chunk
  pageNumber?: number;
  chunkIndex: number;
  createdAt: string;
}

async function upsertVectors(chunks: Chunk[], document: Document) {
  const vectors = await Promise.all(
    chunks.map(async (chunk, i) => ({
      id: `${document.id}-chunk-${i}`,
      values: await embed(chunk.text),
      metadata: {
        documentId: document.id,
        documentName: document.name,
        documentType: document.type,
        organizationId: document.organizationId,
        excerpt: chunk.text.substring(0, 200),
        pageNumber: chunk.pageNumber,
        chunkIndex: i,
        createdAt: new Date().toISOString(),
      },
    }))
  );

  await pineconeIndex.upsert(vectors);
}
```

### Query with Source Mapping

```typescript
// src/server/services/ai/rag.ts
interface QueryResult {
  id: string;
  score: number;
  metadata: PineconeMetadata;
}

export async function queryWithSources(
  query: string,
  organizationId: string,
  topK: number = 5
): Promise<{ results: QueryResult[]; sources: Source[] }> {
  const embedding = await embed(query);

  const queryResponse = await pineconeIndex.query({
    vector: embedding,
    topK,
    filter: { organizationId },
    includeMetadata: true,
  });

  const results = queryResponse.matches;

  // Deduplicate by documentId and map to Source[]
  const sourceMap = new Map<string, Source>();

  results.forEach((match) => {
    const docId = match.metadata.documentId as string;

    if (!sourceMap.has(docId) || (match.score > (sourceMap.get(docId)?.relevanceScore ?? 0) / 100)) {
      sourceMap.set(docId, {
        id: match.id,
        documentId: docId,
        documentName: match.metadata.documentName as string,
        documentType: match.metadata.documentType as DocumentType,
        relevanceScore: Math.round((match.score ?? 0) * 100),
        excerpt: match.metadata.excerpt as string,
        pageNumber: match.metadata.pageNumber as number | undefined,
      });
    }
  });

  return {
    results,
    sources: Array.from(sourceMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore),
  };
}
```

## Audit Trail Integration

For compliance tracking, log all source attributions:

```typescript
// src/server/services/compliance/audit.ts
interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string;
  action: 'ai_generation';
  grantId: string;
  sectionId: string;
  confidence: number;
  sources: Source[];
  generatedAt: Date;
  content: string;
}

export async function logAIGeneration(data: Omit<AuditLogEntry, 'id'>) {
  await prisma.auditLog.create({
    data: {
      ...data,
      sources: JSON.stringify(data.sources),
    },
  });
}
```

## Testing

### Unit Tests

```typescript
// src/components/ui/source-attribution-panel.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SourceAttributionPanel } from "./source-attribution-panel";

describe("SourceAttributionPanel", () => {
  const mockSources = [
    {
      id: "1",
      documentId: "doc-1",
      documentName: "Test Document.pdf",
      documentType: "proposal" as const,
      relevanceScore: 85,
    },
  ];

  it("renders collapsed by default", () => {
    render(
      <SourceAttributionPanel
        sources={mockSources}
        generatedAt={new Date()}
        onSourceClick={jest.fn()}
      />
    );

    expect(screen.getByText(/View 1 Source/)).toBeInTheDocument();
  });

  it("expands on click", () => {
    render(
      <SourceAttributionPanel
        sources={mockSources}
        generatedAt={new Date()}
        onSourceClick={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText(/View 1 Source/));
    expect(screen.getByText("Source Attribution")).toBeInTheDocument();
    expect(screen.getByText("Test Document.pdf")).toBeInTheDocument();
  });

  it("calls onSourceClick when source is clicked", () => {
    const handleClick = jest.fn();

    render(
      <SourceAttributionPanel
        sources={mockSources}
        generatedAt={new Date()}
        onSourceClick={handleClick}
        defaultExpanded
      />
    );

    fireEvent.click(screen.getByText("Test Document.pdf"));
    expect(handleClick).toHaveBeenCalledWith(mockSources[0]);
  });
});
```

## Compliance Checklist

- [x] All AI-generated content includes SourceAttributionPanel
- [x] Sources display document name, type, relevance
- [x] Click to view source document implemented
- [x] Timestamp of generation included
- [x] Copy with attribution functionality
- [x] Confidence thresholds enforced (<60% = no generation)
- [x] Audit logging integrated
- [x] Source deduplication in RAG pipeline
- [x] Pinecone metadata includes all required fields

## Styling Customization

The component uses Tailwind CSS. To customize colors:

```typescript
// Modify border and background colors
const customColors = {
  border: "border-purple-500",
  background: "bg-purple-50/40",
  hoverBg: "hover:bg-purple-100",
};
```

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus states on all buttons
- Screen reader friendly

## Performance Considerations

- Component uses React hooks for state management
- Lazy rendering of expanded content
- Optimized for up to 20 sources (typical RAG scenario)
- Truncation for long document names

## Next Steps

1. **Integrate with Compliance Guardian**: Link sources to commitment registry
2. **Add PDF Export**: Include source attribution in exported reports
3. **Version Control**: Track when sources change between generations
4. **Source Highlighting**: Show exact matched text in documents

---

**Questions?** Contact the development team or file an issue in the repository.
