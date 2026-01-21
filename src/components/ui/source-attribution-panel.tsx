"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, ExternalLink, Copy, Clock } from "lucide-react";
import { Source, SourceAttributionPanelProps, DocumentType } from "@/types/source";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  proposal: "Proposal",
  report: "Report",
  agreement: "Agreement",
  budget: "Budget",
  other: "Document",
};

const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  proposal: "bg-purple-100 text-purple-700 border-purple-200",
  report: "bg-blue-100 text-blue-700 border-blue-200",
  agreement: "bg-green-100 text-green-700 border-green-200",
  budget: "bg-amber-100 text-amber-700 border-amber-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

function truncateFileName(name: string, maxLength: number = 50): string {
  if (name.length <= maxLength) return name;
  const extension = name.split(".").pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
  const truncated = nameWithoutExt.substring(0, maxLength - (extension ? extension.length + 4 : 3));
  return `${truncated}...${extension ? `.${extension}` : ""}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

function RelevanceBar({ score }: { score: number }) {
  const percentage = Math.min(Math.max(score, 0), 100);

  const colorClass =
    percentage >= 80 ? "bg-green-500" :
    percentage >= 60 ? "bg-amber-500" :
    "bg-gray-400";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300 rounded-full", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 tabular-nums min-w-[38px]">
        {percentage}%
      </span>
    </div>
  );
}

function SourceItem({
  source,
  onClick
}: {
  source: Source;
  onClick: (source: Source) => void;
}) {
  return (
    <button
      onClick={() => onClick(source)}
      className="w-full group flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
    >
      <div className="mt-0.5 text-gray-400 group-hover:text-blue-500 transition-colors">
        <FileText className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">
            {truncateFileName(source.documentName)}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap",
            DOCUMENT_TYPE_COLORS[source.documentType]
          )}>
            {DOCUMENT_TYPE_LABELS[source.documentType]}
          </span>
        </div>

        {source.excerpt && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {source.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3">
          <RelevanceBar score={source.relevanceScore} />
          {source.pageNumber && (
            <span className="text-xs text-gray-500">
              Page {source.pageNumber}
            </span>
          )}
        </div>
      </div>

      <div className="mt-0.5 text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
        <ExternalLink className="h-4 w-4" />
      </div>
    </button>
  );
}

export function SourceAttributionPanel({
  sources,
  generatedAt,
  onSourceClick,
  onCopyWithAttribution,
  defaultExpanded = false,
}: SourceAttributionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (sources.length === 0) {
    return null;
  }

  const averageRelevance = Math.round(
    sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length
  );

  return (
    <div className="w-full rounded-lg border-l-2 border-blue-500 bg-blue-50/40 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left group"
        >
          <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
            <FileText className="h-4 w-4" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {isExpanded ? "Source Attribution" : `View ${sources.length} Source${sources.length > 1 ? "s" : ""}`}
              </span>
              <span className="text-xs text-gray-600">
                ({averageRelevance}% avg relevance)
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Generated {formatTimestamp(generatedAt)}</span>
            </div>
          </div>

          <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {onCopyWithAttribution && (
          <button
            onClick={onCopyWithAttribution}
            className="ml-2 p-2 rounded-md text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="Copy with attribution"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expanded Source List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="mb-2 text-xs text-gray-600 border-t border-blue-200/50 pt-3">
            All AI-generated content is based on the following source documents from your organizational memory:
          </div>

          {sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              onClick={onSourceClick}
            />
          ))}

          {sources.length > 3 && (
            <div className="mt-3 pt-3 border-t border-blue-200/50 text-xs text-gray-500 text-center">
              {sources.length} source{sources.length > 1 ? "s" : ""} used for this generation
            </div>
          )}
        </div>
      )}
    </div>
  );
}
