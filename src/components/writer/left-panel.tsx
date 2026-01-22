'use client';

import { useState } from 'react';
import { FileText, Brain, Building2, ChevronDown } from 'lucide-react';

type PanelSection = 'rfp' | 'memory' | 'funder';

export function LeftPanel() {
  const [expandedSection, setExpandedSection] = useState<PanelSection>('rfp');

  const toggleSection = (section: PanelSection) => {
    setExpandedSection(expandedSection === section ? 'rfp' : section);
  };

  return (
    <div className="h-full flex flex-col">
      {/* RFP Requirements */}
      <div className="border-b border-slate-700">
        <button
          onClick={() => toggleSection('rfp')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-100">RFP Requirements</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              expandedSection === 'rfp' ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSection === 'rfp' && (
          <div className="px-4 py-3 space-y-2">
            <div className="text-xs text-slate-400">
              Key requirements from the RFP will appear here
            </div>
          </div>
        )}
      </div>

      {/* Memory Assist */}
      <div className="border-b border-slate-700">
        <button
          onClick={() => toggleSection('memory')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-100">Memory Assist</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              expandedSection === 'memory' ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSection === 'memory' && (
          <div className="px-4 py-3 space-y-2">
            <div className="text-xs text-slate-400">
              Relevant past proposals and templates will appear here
            </div>
          </div>
        )}
      </div>

      {/* Funder Intelligence */}
      <div className="border-b border-slate-700">
        <button
          onClick={() => toggleSection('funder')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-100">Funder Intelligence</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              expandedSection === 'funder' ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSection === 'funder' && (
          <div className="px-4 py-3 space-y-2">
            <div className="text-xs text-slate-400">
              Funder preferences and insights will appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
