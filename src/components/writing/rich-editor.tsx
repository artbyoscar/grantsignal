"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  RemoveFormatting,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  wordLimit?: number;
  aiContentRanges?: Array<{ start: number; end: number }>;
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  wordLimit,
  aiContentRanges = [],
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Calculate word and character counts
  const wordCount = value
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const charCount = value.replace(/<[^>]*>/g, "").length;

  // Word limit status
  const limitPercent = wordLimit ? (wordCount / wordLimit) * 100 : 0;
  const isNearLimit = limitPercent >= 90 && limitPercent < 100;
  const isOverLimit = limitPercent >= 100;

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        formatText("bold");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        formatText("italic");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-save with debounce
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    onChange(content);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set saving state
    setSaveState("saving");

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    }, 1000);
  }, [onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const clearFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      document.execCommand("removeFormat", false);
      document.execCommand("formatBlock", false, "p");
    }
    editorRef.current?.focus();
  };

  return (
    <div className="flex flex-col border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText("bold")}
          title="Bold (Cmd+B)"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText("italic")}
          title="Italic (Cmd+I)"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText("insertUnorderedList")}
          title="Bullet List"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText("insertOrderedList")}
          title="Numbered List"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText("formatBlock", "<h2>")}
          title="Heading 2"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => formatText("formatBlock", "<h3>")}
          title="Heading 3"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFormatting}
          title="Clear Formatting"
          className="h-8 w-8 p-0 hover:bg-slate-600"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>

        {/* Save indicator */}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          {saveState === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="h-3 w-3" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 min-h-[400px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "prose prose-invert max-w-none p-6 outline-none min-h-[400px]",
            "prose-headings:text-slate-100 prose-p:text-slate-200",
            "prose-strong:text-slate-100 prose-em:text-slate-300",
            "prose-ul:text-slate-200 prose-ol:text-slate-200",
            "prose-li:text-slate-200",
            isFocused && "ring-2 ring-blue-500 ring-inset"
          )}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />

        {/* Placeholder */}
        {!value && (
          <div className="absolute top-6 left-6 text-slate-500 pointer-events-none">
            {placeholder}
          </div>
        )}

        {/* AI Content Indicators */}
        {aiContentRanges.length > 0 && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
              AI
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 bg-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "text-slate-400",
              isNearLimit && "text-amber-500 font-medium",
              isOverLimit && "text-red-500 font-medium"
            )}
          >
            {wordCount}
            {wordLimit && ` / ${wordLimit}`} words
          </span>
          <span className="text-slate-500">{charCount} characters</span>
        </div>

        {isNearLimit && !isOverLimit && (
          <span className="text-amber-500 text-xs font-medium">
            Approaching word limit
          </span>
        )}
        {isOverLimit && (
          <span className="text-red-500 text-xs font-medium">
            Over word limit!
          </span>
        )}
      </div>
    </div>
  );
}
