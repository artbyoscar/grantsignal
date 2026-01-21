'use client'

import { Sparkles, RefreshCw, Maximize2, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EditorToolbarProps {
  onGenerate: () => void
  onRefine: () => void
  onExpand: () => void
  onSave: () => void
  isGenerating: boolean
  isSaving: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  hasContent: boolean
}

export function EditorToolbar({
  onGenerate,
  onRefine,
  onExpand,
  onSave,
  isGenerating,
  isSaving,
  saveStatus,
  hasContent,
}: EditorToolbarProps) {
  const saveStatusText = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
    error: 'Save failed',
  }

  const saveStatusColor = {
    saved: 'text-green-400',
    saving: 'text-blue-400',
    unsaved: 'text-amber-400',
    error: 'text-red-400',
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate
        </Button>

        {hasContent && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefine}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refine
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onExpand}
              disabled={isGenerating}
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Expand
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm ${saveStatusColor[saveStatus]}`}>
          {saveStatusText[saveStatus]}
        </span>

        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          disabled={isSaving || saveStatus === 'saved'}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  )
}
