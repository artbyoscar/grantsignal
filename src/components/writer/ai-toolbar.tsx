"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

interface AIToolbarProps {
  onAskClaude: (prompt: string) => void;
  onSuggestImprovements: () => void;
  onCheckTone: () => void;
  onFindStatistics: () => void;
  suggestion?: string;
  isStreaming: boolean;
}

export function AIToolbar({
  onAskClaude,
  onSuggestImprovements,
  onCheckTone,
  onFindStatistics,
  suggestion,
  isStreaming,
}: AIToolbarProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onAskClaude(prompt);
      setPrompt("");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Suggestion Display */}
        {suggestion && (
          <div className="mb-3 text-sm">
            <span className="text-amber-400">AI Suggestion: {suggestion}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {/* Left Side */}
          <div className="flex-1 flex items-center gap-4">
            {/* Label */}
            <div className="flex items-center gap-2 text-slate-300 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Toolbar</span>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex-1 max-w-md">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Claude anything about your grant..."
                className="w-full bg-slate-700 text-slate-100 placeholder-slate-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isStreaming}
              />
            </form>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSuggestImprovements}
                disabled={isStreaming}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-4 py-1.5 text-sm text-slate-200 transition-colors whitespace-nowrap"
              >
                Suggest Improvements
              </button>
              <button
                onClick={onCheckTone}
                disabled={isStreaming}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-4 py-1.5 text-sm text-slate-200 transition-colors whitespace-nowrap"
              >
                Check Tone
              </button>
              <button
                onClick={onFindStatistics}
                disabled={isStreaming}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-4 py-1.5 text-sm text-slate-200 transition-colors whitespace-nowrap"
              >
                Find Statistics
              </button>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4 text-sm text-slate-300">
            {/* Streaming Indicator */}
            {isStreaming && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>AI is thinking...</span>
              </div>
            )}

            {/* Word Count Display */}
            <div className="text-slate-400 whitespace-nowrap">
              <span className="font-mono">1,247</span>
              <span className="mx-1">/</span>
              <span className="font-mono">2,000</span>
              <span className="ml-1">words</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
