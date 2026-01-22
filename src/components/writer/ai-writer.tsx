'use client';

import { useState } from 'react';
import { LeftPanel } from './left-panel';
import { EditorPanel } from './editor-panel';
import { OutlinePanel } from './outline-panel';

export function AIWriter() {
  const [content, setContent] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="h-screen bg-[#0f172a] flex">
      {/* Left Panel: RFP Requirements + Memory Assist + Funder Intelligence */}
      <div className="w-80 border-r border-slate-700 overflow-y-auto">
        <LeftPanel />
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
