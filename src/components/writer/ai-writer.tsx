'use client';

import { useState } from 'react';
import { LeftPanel } from './left-panel';
import { EditorPanel } from './editor-panel';
import { OutlinePanel } from './outline-panel';

export function AIWriter() {
  const [content, setContent] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Mock data for LeftPanel
  const mockRfpSections = [
    {
      id: '1',
      name: 'Executive Summary',
      wordLimit: 500,
      currentWords: 0,
      isComplete: false,
      isActive: false,
    },
  ];

  const mockMemoryResults: any[] = [];

  const mockFunderInfo = {
    funderId: 'mock-id',
    funderName: 'Sample Funder',
    funderType: 'PRIVATE_FOUNDATION',
    focusAreas: ['Education'],
    avgGrantSize: 50000,
    grantSizeRange: {
      min: 25000,
      max: 100000,
      median: 50000,
    },
    totalGiving: 1000000,
    geographicFocus: ['National'],
    applicationProcess: 'Online application',
    isLoading: false,
  };

  return (
    <div className="h-screen bg-[#0f172a] flex">
      {/* Left Panel: RFP Requirements + Memory Assist + Funder Intelligence */}
      <div className="w-80 border-r border-slate-700 overflow-y-auto">
        <LeftPanel
          rfpSections={mockRfpSections}
          memoryResults={mockMemoryResults}
          funderInfo={mockFunderInfo}
          onSectionClick={() => {}}
          onMemorySearch={() => {}}
          onMemoryInsert={() => {}}
          memorySearchQuery=""
          isSearchingMemory={false}
        />
      </div>

      {/* Center Panel: Rich Text Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorPanel
          content={content}
          onChange={setContent}
          activeSection={activeSection}
        />
      </div>

      {/* Right Panel: Section Outline */}
      <div className="w-80 border-l border-slate-700 overflow-y-auto">
        <OutlinePanel
          activeSection={activeSection}
          onSectionSelect={setActiveSection}
        />
      </div>
    </div>
  );
}
