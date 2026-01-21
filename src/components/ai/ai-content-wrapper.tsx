"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Check, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { SourceAttributionPanel } from "@/components/ui/source-attribution-panel";
import { cn } from "@/lib/utils";
import type { Source } from "@/types/source";

interface AIContentWrapperProps {
  children: React.ReactNode;
  confidence: number;
  sources: Source[];
  generatedAt: Date;
  isStreaming?: boolean;
  onAccept?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onSourceClick?: (source: Source) => void;
}

/**
 * AIContentWrapper - Trust Architecture UI Component
 *
 * Wraps all AI-generated content with confidence indicators and source attribution.
 * Implements three-tier confidence system:
 * - High (≥80%): Normal display with subtle indicator
 * - Medium (60-79%): Warning banner, content shown
 * - Low (<60%): Content blocked, sources shown for manual review
 *
 * Part of GrantSignal's Trust Architecture to prevent hallucinations.
 */
export function AIContentWrapper({
  children,
  confidence,
  sources,
  generatedAt,
  isStreaming = false,
  onAccept,
  onEdit,
  onRegenerate,
  onSourceClick,
}: AIContentWrapperProps) {
  // Determine confidence level
  const confidenceLevel =
    confidence >= 80 ? "high" :
    confidence >= 60 ? "medium" :
    "low";

  const showContent = confidenceLevel !== "low";

  return (
    <div className="space-y-4">
      {/* Warning Banners */}
      {confidenceLevel === "medium" && (
        <Alert variant="warning" className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Medium confidence</strong> - Verify accuracy before use.
            Based on {sources.length} source{sources.length !== 1 ? "s" : ""} with partial relevance.
          </AlertDescription>
        </Alert>
      )}

      {confidenceLevel === "low" && (
        <Alert variant="destructive" className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Cannot confidently generate content.</strong> Review these sources manually:
          </AlertDescription>
        </Alert>
      )}

      {/* Content Container */}
      <div
        className={cn(
          "relative rounded-lg border bg-white",
          confidenceLevel === "high" && "border-l-4 border-l-blue-500",
          confidenceLevel === "medium" && "border-l-4 border-l-amber-500",
          confidenceLevel === "low" && "border-l-4 border-l-red-500"
        )}
      >
        {/* Confidence Badge - Top Right */}
        <div className="absolute right-4 top-4 z-10">
          <ConfidenceBadge
            score={confidence}
            size="md"
          />
        </div>

        {/* AI-Generated Content */}
        {showContent && (
          <div className="p-6 pr-32">
            {isStreaming ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse delay-100">●</span>
                    <span className="animate-pulse delay-200">●</span>
                  </div>
                  <span>Generating content...</span>
                </div>
                <div className="prose prose-slate max-w-none">
                  {children}
                </div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                {children}
              </div>
            )}
          </div>
        )}

        {/* Low Confidence - Content Blocked */}
        {!showContent && (
          <div className="p-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 text-red-400 mb-3" />
            <p className="text-sm">
              Content generation blocked due to low confidence ({confidence}%).
              Review sources below for manual drafting.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!isStreaming && showContent && (
          <div className="flex items-center gap-2 border-t bg-muted/50 px-6 py-3">
            {onAccept && (
              <Button
                size="sm"
                onClick={onAccept}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {onRegenerate && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              Generated {generatedAt.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Source Attribution Panel - Always Visible */}
      <SourceAttributionPanel
        sources={sources}
        generatedAt={generatedAt}
        onSourceClick={onSourceClick || (() => {})}
        defaultExpanded={confidenceLevel === "low"}
      />

      {/* Trust Architecture Footer */}
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>
            All AI content includes mandatory source attribution per GrantSignal Trust Architecture
          </span>
        </div>
        <button
          type="button"
          className="text-blue-700 underline hover:text-blue-900"
          onClick={() => {
            // Link to trust architecture docs
            window.open("/docs/trust-architecture", "_blank");
          }}
        >
          Learn more
        </button>
      </div>
    </div>
  );
}

/**
 * Streaming Wrapper - For use during content generation
 * Shows typing indicator until content is ready
 */
export function StreamingAIContent({
  content,
  ...props
}: Omit<AIContentWrapperProps, "children" | "isStreaming"> & {
  content: string;
}) {
  return (
    <AIContentWrapper {...props} isStreaming={true}>
      <p className="whitespace-pre-wrap">{content}</p>
    </AIContentWrapper>
  );
}

/**
 * Content Block Wrapper - For low confidence scenarios
 * Shows only sources, no content generation attempted
 */
export function BlockedAIContent({
  reason,
  ...props
}: Omit<AIContentWrapperProps, "children" | "confidence"> & {
  reason?: string;
}) {
  return (
    <AIContentWrapper {...props} confidence={0}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {reason || "Insufficient relevant sources to generate confident content."}
        </p>
        <p className="text-sm font-medium">
          Manual drafting recommended using sources below.
        </p>
      </div>
    </AIContentWrapper>
  );
}
