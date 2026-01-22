"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  name: string;
  wordLimit?: number;
  required: boolean;
}

interface SectionProgress {
  wordCount: number;
  isComplete: boolean;
}

interface SectionNavigatorProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (name: string) => void;
  sectionProgress: Record<string, SectionProgress>;
}

export function SectionNavigator({
  sections,
  activeSection,
  onSectionChange,
  sectionProgress,
}: SectionNavigatorProps) {
  const completedCount = sections.filter(
    (section) => sectionProgress[section.name]?.isComplete
  ).length;

  const progressPercentage = (completedCount / sections.length) * 100;

  const getCompletionIndicator = (section: Section) => {
    const progress = sectionProgress[section.name];
    const wordCount = progress?.wordCount ?? 0;
    const isComplete = progress?.isComplete ?? false;

    if (isComplete) {
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
          <Check className="h-3 w-3 text-white" />
        </div>
      );
    }

    if (wordCount === 0) {
      return <Circle className="h-5 w-5 text-slate-400" />;
    }

    return (
      <div className="relative h-5 w-5">
        <Circle className="h-5 w-5 text-slate-400" />
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
        >
          <Circle className="h-5 w-5 fill-blue-500 text-blue-500" />
        </div>
      </div>
    );
  };

  const getWordCountDisplay = (section: Section) => {
    const progress = sectionProgress[section.name];
    const wordCount = progress?.wordCount ?? 0;

    if (section.wordLimit) {
      return `${wordCount}/${section.wordLimit}`;
    }

    return `${wordCount}`;
  };

  return (
    <div className="flex h-full flex-col bg-slate-800">
      {/* Section List */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => {
          const isActive = activeSection === section.name;

          return (
            <button
              key={section.name}
              onClick={() => onSectionChange(section.name)}
              className={cn(
                "flex w-full items-center gap-3 border-l-4 px-4 py-2 text-left transition-colors",
                "hover:bg-slate-700/50",
                isActive
                  ? "border-blue-500 bg-slate-700/70"
                  : "border-transparent"
              )}
              style={{ minHeight: "40px" }}
            >
              {/* Completion Indicator */}
              <div className="flex-shrink-0">
                {getCompletionIndicator(section)}
              </div>

              {/* Section Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-100">
                    {section.name}
                  </span>
                  {section.required && (
                    <span className="flex-shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                      Required
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {getWordCountDisplay(section)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="border-t border-slate-700 p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>
            {completedCount} of {sections.length} sections complete
          </span>
          <span className="text-xs text-slate-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
