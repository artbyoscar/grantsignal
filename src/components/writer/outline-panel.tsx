'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import {
  STANDARD_SECTIONS,
  calculateSectionProgress,
  calculateOverallProgress,
  type SectionProgress,
} from '@/lib/writer/sections';

interface OutlinePanelProps {
  activeSection: string | null;
  onSectionSelect: (section: string) => void;
  sectionContents: Record<string, string>;
}

export function OutlinePanel({
  activeSection,
  onSectionSelect,
  sectionContents
}: OutlinePanelProps) {
  // Calculate real progress for each section
  const sections: SectionProgress[] = STANDARD_SECTIONS.map((section) => {
    const content = sectionContents[section.id] || '';
    return calculateSectionProgress(section, content);
  });

  const overallCompletion = calculateOverallProgress(sections);

  const getStatusIcon = (status: SectionProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Overall Progress */}
      <div className="px-4 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-100">Overall Progress</span>
          <span className="text-lg font-bold text-slate-100">{overallCompletion}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {sections.map((section) => (
            <button
              key={section.sectionId}
              onClick={() => onSectionSelect(section.sectionId)}
              className={`w-full px-3 py-3 rounded-lg transition-colors text-left ${
                activeSection === section.sectionId
                  ? 'bg-blue-900/30 border border-blue-700'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {getStatusIcon(section.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-100 mb-1">
                    {section.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          section.status === 'completed'
                            ? 'bg-green-500'
                            : section.status === 'in-progress'
                            ? 'bg-blue-500'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${section.completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {section.completionPercentage}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {section.currentWordCount} / {section.targetWordCount} words
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
