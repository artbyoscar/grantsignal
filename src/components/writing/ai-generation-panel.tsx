'use client'

import { useState } from 'react'
import { Sparkles, FileText, AlertTriangle, X, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfidenceIndicator } from './confidence-indicator'

export interface GenerationResult {
  content: string
  sources: Array<{
    documentId: string
    documentName: string
    relevance: number
  }>
  confidence: 'high' | 'medium' | 'low'
  confidenceScore: number
}

export interface AIGenerationPanelProps {
  result: GenerationResult | null
  onInsert: (content: string) => void
  onRegenerate: () => void
  onDismiss: () => void
}

export function AIGenerationPanel({
  result,
  onInsert,
  onRegenerate,
  onDismiss,
}: AIGenerationPanelProps) {
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showContent = result.confidence !== 'low'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">AI Generated Content</h3>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="p-4 border-b border-slate-700">
        <ConfidenceIndicator
          confidence={result.confidence}
          score={result.confidenceScore}
        />
      </div>

      <div className="p-4">
        {showContent ? (
          <>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                {result.content}
              </p>
            </div>

            {result.confidence === 'medium' && (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Review this content carefully. Some information may be based
                  on limited context.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium mb-1">Low Confidence</p>
                <p className="text-sm text-red-400">
                  Limited organizational context was found. Content generation
                  is not recommended. Consider uploading more relevant documents
                  to improve results.
                </p>
              </div>
            </div>
          </div>
        )}

        {result.sources.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2">Sources Used</h4>
            <div className="space-y-2">
              {result.sources.map((source, idx) => (
                <div
                  key={`${source.documentId}-${idx}`}
                  className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-700 rounded"
                >
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300 flex-1 truncate">
                    {source.documentName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {source.relevance}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {showContent && (
            <>
              <Button onClick={() => onInsert(result.content)} className="flex-1">
                Insert Content
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onRegenerate}>
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  )
}
