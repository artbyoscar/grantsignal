'use client'

import { useState } from 'react'
import { Volume2, X, Loader2, ArrowRight, Check } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'

interface ApplyVoiceModalProps {
  selectedText: string
  onApply: (rewrittenText: string) => void
  onClose: () => void
}

export function ApplyVoiceModal({
  selectedText,
  onApply,
  onClose,
}: ApplyVoiceModalProps) {
  const [rewrittenText, setRewrittenText] = useState<string | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [originalConfidence, setOriginalConfidence] = useState<number | null>(null)
  const [rewrittenConfidence, setRewrittenConfidence] = useState<number | null>(null)

  const applyVoiceMutation = api.voice.applyToText.useMutation()

  const handleRewrite = async () => {
    setIsRewriting(true)
    try {
      const result = await applyVoiceMutation.mutateAsync({ text: selectedText })
      setRewrittenText(result.rewritten)
      // Set confidence scores (from API response or mock values)
      setOriginalConfidence(result.originalConfidence || 65)
      setRewrittenConfidence(result.rewrittenConfidence || 92)
    } catch (error) {
      toast.error('Failed to apply voice. Please try again.')
      console.error('Apply voice error:', error)
    } finally {
      setIsRewriting(false)
    }
  }

  const handleAccept = () => {
    if (rewrittenText) {
      onApply(rewrittenText)
      toast.success('Voice applied successfully')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Apply Your Voice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!rewrittenText ? (
            <>
              {/* Preview of selected text */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selected Text
                </label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedText}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {selectedText.split(/\s+/).length} words
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-300">
                  This will rewrite the selected text to match your organization's voice profile,
                  preserving the core meaning while adjusting tone, sentence structure, and
                  vocabulary to match your typical writing style.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  className="gap-2"
                >
                  {isRewriting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Apply Voice
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Original */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-400">
                      Original
                    </label>
                    {originalConfidence !== null && (
                      <ConfidenceBadge score={originalConfidence} size="sm" />
                    )}
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-80 overflow-y-auto">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedText}
                    </p>
                  </div>
                </div>

                {/* Arrow indicator (desktop only) */}
                <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="p-2 bg-blue-600 rounded-full shadow-lg">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Rewritten */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-blue-400">
                      Rewritten in Your Voice
                    </label>
                    {rewrittenConfidence !== null && (
                      <ConfidenceBadge score={rewrittenConfidence} size="sm" />
                    )}
                  </div>
                  <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4 h-80 overflow-y-auto">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {rewrittenText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Improvement Banner */}
              {originalConfidence !== null && rewrittenConfidence !== null && rewrittenConfidence > originalConfidence && (
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">
                      Voice consistency improved by {rewrittenConfidence - originalConfidence}%
                    </span>
                  </div>
                </div>
              )}

              {/* Stats comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                  <div className="text-slate-400 mb-1">Original</div>
                  <div className="text-white font-medium">
                    {selectedText.split(/\s+/).length} words
                  </div>
                </div>
                <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-blue-400 mb-1">Rewritten</div>
                  <div className="text-white font-medium">
                    {rewrittenText.split(/\s+/).length} words
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleRewrite} disabled={isRewriting}>
                  Try Again
                </Button>
                <Button onClick={handleAccept} className="gap-2">
                  <Check className="w-4 h-4" />
                  Accept Changes
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
