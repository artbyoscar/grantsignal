'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface OutlinePanelProps {
  activeSection: string | null;
  onSectionSelect: (section: string) => void;
}

interface Section {
  id: string;
  title: string;
  completion: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

export function OutlinePanel({ activeSection, onSectionSelect }: OutlinePanelProps) {
  // Mock data - will be replaced with real data
  const sections: Section[] = [
    { id: '1', title: 'Executive Summary', completion: 100, status: 'completed' },
    { id: '2', title: 'Organization Background', completion: 75, status: 'in-progress' },
    { id: '3', title: 'Problem Statement', completion: 50, status: 'in-progress' },
    { id: '4', title: 'Project Description', completion: 0, status: 'not-started' },
    { id: '5', title: 'Goals and Objectives', completion: 0, status: 'not-started' },
    { id: '6', title: 'Methods and Strategies', completion: 0, status: 'not-started' },
    { id: '7', title: 'Evaluation Plan', completion: 0, status: 'not-started' },
    { id: '8', title: 'Budget and Justification', completion: 0, status: 'not-started' },
    { id: '9', title: 'Sustainability Plan', completion: 0, status: 'not-started' },
  ];

  const overallCompletion = Math.round(
    sections.reduce((acc, section) => acc + section.completion, 0) / sections.length
  );

  const getStatusIcon = (status: Section['status']) => {
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
              key={section.id}
              onClick={() => onSectionSelect(section.title)}
              className={`w-full px-3 py-3 rounded-lg transition-colors text-left ${
                activeSection === section.title
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
                        style={{ width: `${section.completion}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {section.completion}%
                    </span>
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
