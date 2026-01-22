"use client";

import Link from "next/link";
import { Sparkles, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface AIInsight {
  id: string;
  type: "opportunity" | "deadline" | "trend" | "compliance";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

interface AIDigestProps {
  insights: AIInsight[];
  onRefresh: () => void;
}

export function AIDigest({ insights, onRefresh }: AIDigestProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    // Simulate a slight delay for better UX
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const hasInsights = insights.length > 0;

  return (
    <Card className="border-l-4 border-l-blue-500 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-slate-100 flex-1">
          AI Daily Digest
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          <span className="sr-only">Refresh insights</span>
        </Button>
      </div>

      {/* Content */}
      {hasInsights ? (
        <>
          <div className="divide-y divide-slate-700/50">
            {insights.map((insight) => {
              const typeColors = {
                opportunity: "text-emerald-400",
                deadline: "text-amber-400",
                trend: "text-purple-400",
                compliance: "text-orange-400",
              };

              const typeColor = typeColors[insight.type] || "text-blue-400";

              return (
                <div
                  key={insight.id}
                  className="p-4 flex items-start gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-400">
                        AI Insight:
                      </p>
                      <h3
                        className={cn(
                          "text-sm font-medium leading-tight",
                          typeColor
                        )}
                      >
                        {insight.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>

                    {/* Optional action link */}
                    {insight.actionLabel && insight.actionHref && (
                      <Link
                        href={insight.actionHref}
                        className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {insight.actionLabel} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer - Learn more expand button */}
          <div className="border-t border-slate-700/50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full p-3 flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-800/30 transition-colors"
            >
              <span className="font-medium">Learn more</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2 text-sm text-slate-400">
                <p>
                  AI Daily Digest analyzes your grants portfolio, upcoming
                  deadlines, and funder trends to surface actionable insights.
                </p>
                <p>
                  Insights are refreshed daily and prioritized based on urgency
                  and potential impact.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Empty state
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">
              No insights yet
            </h3>
            <p className="text-sm text-slate-400">
              Check back later for AI-generated insights
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
