"use client";

import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface MemoryResult {
  id: string;
  source: string;
  title: string;
  relevanceScore: number;
  excerpt: string;
  documentId: string;
}

export interface MemoryAssistProps {
  results: MemoryResult[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onInsert: (result: MemoryResult) => void;
  isSearching: boolean;
}

export function MemoryAssist({
  results,
  searchQuery,
  onSearchChange,
  onInsert,
  isSearching,
}: MemoryAssistProps) {
  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-100">
          Memory Assist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search past content, docs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-slate-900 border-slate-700 rounded-lg px-4 py-2 pl-10 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Results List */}
        <div className="space-y-2">
          {isSearching ? (
            // Loading State
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 rounded-lg p-3 space-y-2"
                >
                  <Skeleton className="h-4 w-3/4 bg-slate-800" />
                  <Skeleton className="h-3 w-1/4 bg-slate-800" />
                  <Skeleton className="h-3 w-full bg-slate-800" />
                  <Skeleton className="h-3 w-full bg-slate-800" />
                  <Skeleton className="h-3 w-2/3 bg-slate-800" />
                </div>
              ))}
            </>
          ) : results.length > 0 ? (
            // Results
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => onInsert(result)}
                className="w-full bg-slate-900/50 rounded-lg p-3 text-left hover:bg-slate-900 transition-colors group relative"
                title="Click to insert"
              >
                <div className="space-y-2">
                  {/* Source Badge */}
                  <Badge
                    variant="outline"
                    className="bg-slate-800/50 border-slate-700 text-slate-300 text-xs"
                  >
                    Source: {result.source}
                  </Badge>

                  {/* Relevance Score */}
                  <div className="text-emerald-400 text-sm font-medium">
                    Relevance score: {Math.round(result.relevanceScore)}%
                  </div>

                  {/* Excerpt */}
                  <p className="text-slate-400 text-sm line-clamp-3">
                    {result.excerpt}
                  </p>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded-lg pointer-events-none">
                  <span className="text-slate-200 text-sm font-medium">
                    Click to insert
                  </span>
                </div>
              </button>
            ))
          ) : searchQuery ? (
            // No Results State
            <div className="text-center py-8 text-slate-500">
              No results found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            // Empty State
            <div className="text-center py-8 text-slate-500">
              Search your organizational memory
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
