/**
 * EXAMPLE USAGE: SourceAttributionPanel
 *
 * This file demonstrates how to use the SourceAttributionPanel component
 * in the AI Writing Studio and other contexts where AI-generated content
 * needs mandatory source attribution.
 */

"use client";

import { SourceAttributionPanel } from "./source-attribution-panel";
import { Source } from "@/types/source";

// Example 1: Basic usage in AI Writing Studio
export function WritingStudioExample() {
  const exampleSources: Source[] = [
    {
      id: "src-1",
      documentId: "doc-abc-123",
      documentName: "Youth Development Program Proposal - Community Foundation 2024.docx",
      documentType: "proposal",
      relevanceScore: 92,
      excerpt: "Our youth development program served 450 participants in 2024, with 89% reporting improved conflict resolution skills...",
      pageNumber: 3,
    },
    {
      id: "src-2",
      documentId: "doc-def-456",
      documentName: "Annual Impact Report 2024.pdf",
      documentType: "report",
      relevanceScore: 87,
      excerpt: "Program outcomes exceeded targets with 95% participant retention and 78% goal achievement rate...",
      pageNumber: 12,
    },
    {
      id: "src-3",
      documentId: "doc-ghi-789",
      documentName: "Grant Agreement - State Youth Services.pdf",
      documentType: "agreement",
      relevanceScore: 76,
      excerpt: "Grantee shall provide services to at least 400 youth annually, with quarterly reporting requirements...",
      pageNumber: 5,
    },
  ];

  const handleSourceClick = (source: Source) => {
    console.log("Opening document:", source.documentId);
    // Implementation: Open document in modal or new tab
    // Example: router.push(`/documents/${source.documentId}?page=${source.pageNumber}`);
  };

  const handleCopyWithAttribution = () => {
    const content = document.querySelector("#ai-generated-content")?.textContent || "";
    const attribution = exampleSources
      .map((s, i) => `[${i + 1}] ${s.documentName} (${s.relevanceScore}% match)`)
      .join("\n");

    const fullText = `${content}\n\n---\nSources:\n${attribution}`;

    navigator.clipboard.writeText(fullText);
    console.log("Copied with attribution!");
    // Show toast notification
  };

  return (
    <div className="space-y-4 p-6">
      {/* AI-Generated Content */}
      <div id="ai-generated-content" className="p-4 bg-white rounded-lg border">
        <p className="text-gray-700">
          Our youth development program has demonstrated significant impact, serving 450
          participants in 2024 with an 89% improvement in conflict resolution skills.
          Program outcomes exceeded targets with 95% participant retention and 78% goal
          achievement rate, building on our commitment to provide services to at least
          400 youth annually.
        </p>
      </div>

      {/* Source Attribution Panel */}
      <SourceAttributionPanel
        sources={exampleSources}
        generatedAt={new Date(Date.now() - 5 * 60000)} // 5 minutes ago
        onSourceClick={handleSourceClick}
        onCopyWithAttribution={handleCopyWithAttribution}
        defaultExpanded={false}
      />
    </div>
  );
}

// Example 2: High-confidence scenario (≥80%)
export function HighConfidenceExample() {
  const sources: Source[] = [
    {
      id: "src-1",
      documentId: "doc-1",
      documentName: "Similar Program Proposal 2023.docx",
      documentType: "proposal",
      relevanceScore: 94,
    },
    {
      id: "src-2",
      documentId: "doc-2",
      documentName: "Program Budget Narrative.xlsx",
      documentType: "budget",
      relevanceScore: 88,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="font-medium text-green-700">High confidence generation</span>
      </div>

      <SourceAttributionPanel
        sources={sources}
        generatedAt={new Date()}
        onSourceClick={(s) => console.log(s)}
      />
    </div>
  );
}

// Example 3: Medium-confidence scenario (60-79%)
export function MediumConfidenceExample() {
  const sources: Source[] = [
    {
      id: "src-1",
      documentId: "doc-1",
      documentName: "Related Grant Report.pdf",
      documentType: "report",
      relevanceScore: 72,
      excerpt: "Some relevant content but not exact match...",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="font-medium text-amber-700">
          Verify accuracy before use
        </span>
      </div>

      <SourceAttributionPanel
        sources={sources}
        generatedAt={new Date()}
        onSourceClick={(s) => console.log(s)}
        defaultExpanded={true}
      />
    </div>
  );
}

// Example 4: Low-confidence scenario (<60%) - Content NOT generated
export function LowConfidenceExample() {
  const sources: Source[] = [
    {
      id: "src-1",
      documentId: "doc-1",
      documentName: "Loosely Related Document.pdf",
      documentType: "other",
      relevanceScore: 45,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          <strong>Cannot confidently adapt content.</strong> Here are relevant sources
          for manual review:
        </p>
      </div>

      <SourceAttributionPanel
        sources={sources}
        generatedAt={new Date()}
        onSourceClick={(s) => console.log(s)}
        defaultExpanded={true}
      />
    </div>
  );
}
