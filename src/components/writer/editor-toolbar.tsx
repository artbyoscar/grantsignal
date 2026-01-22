"use client";

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Sparkles,
  Wand2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface EditorToolbarProps {
  onFormat: (format: string) => void;
  onGenerate: () => void;
  onImprove: () => void;
  onExpand: () => void;
  onShorten: () => void;
  isGenerating: boolean;
}

export function EditorToolbar({
  onFormat,
  onGenerate,
  onImprove,
  onExpand,
  onShorten,
  isGenerating,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between bg-slate-800 border-b border-slate-700 px-4 py-2">
      {/* Left section - Formatting controls */}
      <div className="flex items-center gap-1">
        {/* Font selector */}
        <select
          className="bg-slate-700 text-slate-100 rounded px-2 py-1.5 text-sm border border-slate-600 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 mr-2"
          defaultValue="Inter"
          onChange={(e) => onFormat(`font-${e.target.value}`)}
        >
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>

        {/* Text formatting */}
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("bold")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("italic")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("underline")}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("strikethrough")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        {/* Headings */}
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("h1")}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("h2")}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("h3")}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        {/* Lists and blocks */}
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("bullet-list")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("numbered-list")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("quote")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        {/* Media */}
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("link")}
          title="Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
          onClick={() => onFormat("image")}
          title="Image"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>

      {/* Right section - AI actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          <Sparkles className="w-4 h-4" />
          Generate
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onImprove}
          disabled={isGenerating}
        >
          <Wand2 className="w-4 h-4" />
          Improve
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onExpand}
          disabled={isGenerating}
        >
          <Maximize2 className="w-4 h-4" />
          Expand
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onShorten}
          disabled={isGenerating}
        >
          <Minimize2 className="w-4 h-4" />
          Shorten
        </button>
      </div>
    </div>
  );
}
