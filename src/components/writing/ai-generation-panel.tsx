'use client'

import { useState } from 'react'
import { Loader2, X, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { AIContentWrapper } from '@/components/ai/ai-content-wrapper'
import type { Source as TrustSource } from '@/components/ai/ai-content-wrapper'

export interface Source {
  documentId: string
  documentName: string
  text: string
  score: number
  chunkIndex: number
}

interface AIGenerationPanelProps {
  grantId: string
  sectionName: string
  onAccept: (content: string, sources: Source[]) => void
  onClose: () => void
}

type GenerationMode = 'memory_assist' | 'ai_draft'

// Convert Source to TrustSource format
function convertToTrustSource(source: Source, index: number): TrustSource {
  return {
    id: `${source.documentId}-${source.chunkIndex}`,
    title: source.documentName,
    excerpt: source.text.slice(0, 150) + (source.text.length > 150 ? '...' : ''),
    relevanceScore: source.score,
    documentId: source.documentId,
  }
}

export function AIGenerationPanel({
  grantId,
  sectionName,
  onAccept,
  onClose,
}: AIGenerationPanelProps) {
  // State
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<GenerationMode>('memory_assist')
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [confidence, setConfidence] = useState<number | null>(null)
  const [lowConfidenceMessage, setLowConfidenceMessage] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  // API mutation
  const generateMutation = api.writing.generateDraft.useMutation({
    onSuccess: (data) => {
      if (data.shouldGenerate && data.content) {
        setGeneratedContent(data.content)
        setSources(data.sources)
        setConfidence(data.confidence)
        setLowConfidenceMessage(null)
        setGeneratedAt(new Date())
        toast.success(data.message)
      } else {
        // Low confidence - show sources but no generated content
        setGeneratedContent(null)
        setSources(data.sources)
        setConfidence(data.confidence)
        setLowConfidenceMessage(data.message || 'Cannot confidently generate content')
        setGeneratedAt(new Date())
        toast.warning('Confidence too low for generation')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Handlers
  const handleGenerate = () => {
    if (prompt.length < 10) {
      toast.error('Please provide a more detailed prompt (at least 10 characters)')
      return
    }

    generateMutation.mutate({
      grantId,
      sectionName,
      prompt,
      mode,
    })
  }

  const handleAccept = () => {
    if (generatedContent && sources.length > 0) {
      onAccept(generatedContent, sources)
      toast.success('Content accepted')
    }
  }

  const handleRegenerate = () => {
    setGeneratedContent(null)
    setSources([])
    setConfidence(null)
    setLowConfidenceMessage(null)
    setGeneratedAt(null)
  }

  const handleSourceClick = (source: TrustSource) => {
    // Open document in new tab
    window.open(`/documents/${source.documentId}`, '_blank')
  }

  // Render states
  const isLoading = generateMutation.isPending
  const hasError = generateMutation.isError
  const hasGeneratedContent = generatedContent !== null && confidence !== null && confidence >= 60
  const hasLowConfidence = confidence !== null && confidence < 60

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI Generation Assistant</h2>
            <p className="text-sm text-slate-600">Section: {sectionName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {/* STATE 1: Input State */}
          {!isLoading && !hasGeneratedContent && !hasLowConfidence && !hasError && (
            <div className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe what you need
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Write about our organization's impact in community health programs over the past 3 years..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  rows={6}
                />
              </div>

              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Generation Mode
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('memory_assist')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      mode === 'memory_assist'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="font-medium">Memory Assist</div>
                    <div className="text-xs mt-1 opacity-80">
                      Suggest content based on your documents
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('ai_draft')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      mode === 'ai_draft'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="font-medium">AI Draft</div>
                    <div className="text-xs mt-1 opacity-80">
                      Generate complete draft from memory
                    </div>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={prompt.length < 10}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                Generate
              </button>
            </div>
          )}

          {/* STATE 2: Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <p className="text-slate-700 animate-pulse">
                  Claude is writing<span className="animate-[pulse_1s_ease-in-out_infinite]">...</span>
                </p>
              </div>

              {/* Skeleton Lines */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-slate-200 rounded animate-pulse"
                    style={{ width: `${Math.random() * 30 + 70}%` }}
                  />
                ))}
              </div>

              <button
                onClick={() => generateMutation.reset()}
                className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          )}

          {/* STATE 3: Result State with AIContentWrapper (confidence >= 60%) */}
          {hasGeneratedContent && generatedAt && (
            <AIContentWrapper
              confidence={confidence!}
              sources={sources.map((s, i) => convertToTrustSource(s, i))}
              generatedAt={generatedAt}
              isStreaming={false}
              onAccept={handleAccept}
              onRegenerate={handleRegenerate}
              onSourceClick={handleSourceClick}
            >
              <div className="whitespace-pre-wrap">{generatedContent}</div>
            </AIContentWrapper>
          )}

          {/* STATE 4: Low Confidence State (confidence < 60%) */}
          {hasLowConfidence && generatedAt && (
            <AIContentWrapper
              confidence={confidence!}
              sources={sources.map((s, i) => convertToTrustSource(s, i))}
              generatedAt={generatedAt}
              onSourceClick={handleSourceClick}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {lowConfidenceMessage ||
                    "The retrieved documents don't have strong enough matches. Review sources for manual drafting."}
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Write manually using these sources
                </button>
              </div>
            </AIContentWrapper>
          )}

          {/* STATE 5: Error State */}
          {hasError && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Generation failed</h3>
                  <p className="text-sm text-red-700">
                    {generateMutation.error?.message || 'An unexpected error occurred'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  generateMutation.reset()
                  handleRegenerate()
                }}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
