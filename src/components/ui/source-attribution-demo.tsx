"use client";

import { SourceAttributionPanel } from "./source-attribution-panel";
import { Source } from "@/types/source";

/**
 * Demo component showing all three confidence states side-by-side.
 * Useful for testing, documentation, and visual QA.
 *
 * To use: Import in a page and render <SourceAttributionDemo />
 */

export function SourceAttributionDemo() {
  // High confidence sources (≥80%)
  const highConfidenceSources: Source[] = [
    {
      id: "hc-1",
      documentId: "doc-abc-123",
      documentName: "Youth Development Program Proposal - Community Foundation 2024.docx",
      documentType: "proposal",
      relevanceScore: 94,
      excerpt: "Our evidence-based youth development program served 450 participants in 2024, with 89% reporting improved conflict resolution skills and 92% demonstrating enhanced leadership capabilities...",
      pageNumber: 3,
    },
    {
      id: "hc-2",
      documentId: "doc-def-456",
      documentName: "Annual Impact Report 2024.pdf",
      documentType: "report",
      relevanceScore: 89,
      excerpt: "Program outcomes exceeded all targets with 95% participant retention, 78% goal achievement rate, and measurable improvements in youth development indicators across all program areas...",
      pageNumber: 12,
    },
    {
      id: "hc-3",
      documentId: "doc-ghi-789",
      documentName: "Program Budget Narrative FY2024.xlsx",
      documentType: "budget",
      relevanceScore: 85,
      excerpt: "Personnel costs represent 62% of total budget, supporting 3 FTE program staff and 1 FTE program coordinator. Participant supplies allocated at $45/participant based on historical data...",
    },
    {
      id: "hc-4",
      documentId: "doc-jkl-012",
      documentName: "Grant Agreement - State Youth Services Department.pdf",
      documentType: "agreement",
      relevanceScore: 82,
      excerpt: "Grantee shall provide comprehensive youth development services to at least 400 unduplicated youth annually, with quarterly progress reports due 15 days after quarter end...",
      pageNumber: 5,
    },
  ];

  // Medium confidence sources (60-79%)
  const mediumConfidenceSources: Source[] = [
    {
      id: "mc-1",
      documentId: "doc-mno-345",
      documentName: "Related Community Program Report 2023.pdf",
      documentType: "report",
      relevanceScore: 74,
      excerpt: "While focused on adult education, this program demonstrates our organization's capacity for outcome measurement and data-driven program improvements...",
      pageNumber: 8,
    },
    {
      id: "mc-2",
      documentId: "doc-pqr-678",
      documentName: "Previous Youth Grant Proposal 2022.docx",
      documentType: "proposal",
      relevanceScore: 68,
      excerpt: "Program design elements may be relevant but metrics and participant numbers are from 2022 and may not reflect current capacity...",
      pageNumber: 15,
    },
  ];

  // Low confidence sources (<60%)
  const lowConfidenceSources: Source[] = [
    {
      id: "lc-1",
      documentId: "doc-stu-901",
      documentName: "Board Meeting Minutes - March 2024.pdf",
      documentType: "other",
      relevanceScore: 52,
      excerpt: "Brief mention of youth programs in board discussion but lacks specific program details or outcome data...",
      pageNumber: 4,
    },
    {
      id: "lc-2",
      documentId: "doc-vwx-234",
      documentName: "Organization Strategic Plan 2023-2025.pdf",
      documentType: "other",
      relevanceScore: 48,
      excerpt: "High-level strategic priorities mentioned but no specific program implementation details or measurable outcomes...",
      pageNumber: 22,
    },
  ];

  const handleSourceClick = (source: Source) => {
    console.log("Opening document:", source);
    alert(`Opening: ${source.documentName}\nDocument ID: ${source.documentId}\nRelevance: ${source.relevanceScore}%`);
  };

  const handleCopy = (sources: Source[], content: string) => {
    const attribution = sources
      .map((s, i) => `[${i + 1}] ${s.documentName} (${s.relevanceScore}% match)`)
      .join("\n");

    const fullText = `${content}\n\n---\nSources:\n${attribution}`;

    navigator.clipboard.writeText(fullText);
    alert("Copied with attribution!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Source Attribution Panel - Confidence States
          </h1>
          <p className="text-gray-600">
            Visual comparison of AI trust architecture at different confidence levels
          </p>
        </div>

        {/* High Confidence (≥80%) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                High Confidence (≥80%)
              </h2>
              <p className="text-sm text-gray-600">
                Content generated normally with green indicator
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">
                High confidence
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <p className="text-gray-700 mb-4">
              Our evidence-based youth development program has demonstrated significant
              impact, serving 450 participants in 2024 with 89% reporting improved conflict
              resolution skills and 92% demonstrating enhanced leadership capabilities.
              Program outcomes exceeded all targets with 95% participant retention and 78%
              goal achievement rate. Our comprehensive approach, supported by a dedicated
              team and $45 per-participant investment, has proven effective in creating
              measurable positive change for young people in our community.
            </p>

            <SourceAttributionPanel
              sources={highConfidenceSources}
              generatedAt={new Date(Date.now() - 5 * 60000)} // 5 mins ago
              onSourceClick={handleSourceClick}
              onCopyWithAttribution={() => handleCopy(highConfidenceSources, "Generated content here...")}
            />
          </div>
        </div>

        {/* Medium Confidence (60-79%) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Medium Confidence (60-79%)
              </h2>
              <p className="text-sm text-gray-600">
                Content shown with amber warning - verify accuracy before use
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                Verify accuracy before use
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <p className="text-gray-700 mb-4">
              Our organization has demonstrated capacity for outcome measurement and
              data-driven program improvements through various initiatives. While previous
              youth programming shows relevant experience, metrics may need updating to
              reflect current program capacity and recent outcomes.
            </p>

            <SourceAttributionPanel
              sources={mediumConfidenceSources}
              generatedAt={new Date(Date.now() - 15 * 60000)} // 15 mins ago
              onSourceClick={handleSourceClick}
              onCopyWithAttribution={() => handleCopy(mediumConfidenceSources, "Generated content here...")}
              defaultExpanded={true} // Auto-expand for lower confidence
            />
          </div>
        </div>

        {/* Low Confidence (<60%) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Low Confidence (&lt;60%)
              </h2>
              <p className="text-sm text-gray-600">
                Content NOT generated - sources provided for manual review only
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-700">
                Cannot confidently adapt content
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Cannot confidently adapt content.</strong> The available sources
                do not contain sufficient specific information about your program to
                generate accurate content. Please review the sources below for manual
                reference or upload more relevant documents to your organizational memory.
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg border shadow-sm">
              <SourceAttributionPanel
                sources={lowConfidenceSources}
                generatedAt={new Date(Date.now() - 2 * 60000)} // 2 mins ago
                onSourceClick={handleSourceClick}
                defaultExpanded={true} // Always expanded for manual review
              />
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Implementation Notes
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ All AI outputs include mandatory source attribution</li>
            <li>✓ Confidence thresholds enforce trust architecture</li>
            <li>✓ Sources show document type, relevance, and excerpts</li>
            <li>✓ Click any source to open the full document</li>
            <li>✓ "Copy with Attribution" preserves source references</li>
            <li>✓ Auto-expand for lower confidence levels</li>
            <li>✓ Timestamp shows recency of generation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
