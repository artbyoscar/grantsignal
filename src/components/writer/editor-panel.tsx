'use client';

import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles
} from 'lucide-react';

interface EditorPanelProps {
  content: string;
  onChange: (content: string) => void;
  activeSection: string | null;
}

export function EditorPanel({ content, onChange, activeSection }: EditorPanelProps) {
  const [isAIAssisting, setIsAIAssisting] = useState(false);

  const toolbarButtons = [
    { icon: Bold, label: 'Bold' },
    { icon: Italic, label: 'Italic' },
    { icon: Underline, label: 'Underline' },
    { icon: List, label: 'Bullet List' },
    { icon: ListOrdered, label: 'Numbered List' },
    { icon: AlignLeft, label: 'Align Left' },
    { icon: AlignCenter, label: 'Align Center' },
    { icon: AlignRight, label: 'Align Right' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-slate-700 bg-slate-800/30 backdrop-blur">
        <div className="px-4 py-2 flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              className="p-2 hover:bg-slate-700/50 rounded transition-colors"
              title={button.label}
            >
              <button.icon className="w-4 h-4 text-slate-300" />
            </button>
          ))}

          <div className="ml-auto">
            <button
              onClick={() => setIsAIAssisting(!isAIAssisting)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">AI Assist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {activeSection && (
            <div className="mb-4 px-4 py-2 bg-blue-900/20 border border-blue-700 rounded-lg">
              <span className="text-sm text-blue-300">
                Editing: <span className="font-medium">{activeSection}</span>
              </span>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[600px] bg-transparent text-slate-100 placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
            placeholder="Start writing your proposal here..."
          />
        </div>
      </div>
    </div>
  );
}
