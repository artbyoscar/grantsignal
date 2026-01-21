'use client'

import { useState } from 'react'
import { Loader2, X, Check, RefreshCw, XCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

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
  const [editableContent, setEditableContent] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // API mutation
  const generateMutation = api.writing.generateDraft.useMutation({
    onSuccess: (data) => {
      if (data.shouldGenerate && data.content) {
        setGeneratedContent(data.content)
        setSources(data.sources)
        setConfidence(data.confidence)
        setLowConfidenceMessage(null)
        setIsEditing(false)
        setEditableContent(null)
        toast.success(data.message)
      } else {
        // Low confidence - show sources but no generated content
        setGeneratedContent(null)
        setSources(data.sources)
        setConfidence(data.confidence)
        setLowConfidenceMessage(data.message || 'Cannot confidently generate content')
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
    const contentToAccept = editableContent || generatedContent
    if (contentToAccept && sources.length > 0) {
      onAccept(contentToAccept, sources)
      toast.success('Content accepted')
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditableContent(generatedContent)
  }

  const handleRegenerate = () => {
    setGeneratedContent(null)
    setSources([])
    setConfidence(null)
    setLowConfidenceMessage(null)
    setIsEditing(false)
    setEditableContent(null)
  }

  const handleReject = () => {
    handleRegenerate()
    toast.info('Content rejected')
  }

  const handleViewDocument = (documentId: string) => {
    // Open document in new tab (you can customize this URL)
    window.open(`/documents/${documentId}`, '_blank')
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return { text: 'High confidence', color: 'text-green-400' }
    if (score >= 60) return { text: 'Medium confidence', color: 'text-amber-400' }
    return { text: 'Low confidence', color: 'text-red-400' }
  }

  // Render states
  const isLoading = generateMutation.isPending
  const hasError = generateMutation.isError
  const hasGeneratedContent = generatedContent !== null
  const hasLowConfidence = lowConfidenceMessage !== null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Generation Assistant</h2>
            <p className="text-sm text-slate-400">Section: {sectionName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STATE 1: Input State */}
          {!isLoading && !hasGeneratedContent && !hasLowConfidence && !hasError && (
            <div className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Describe what you need
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Write about our organization's impact in community health programs over the past 3 years..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  rows={6}
                />
              </div>

              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Generation Mode
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('memory_assist')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      mode === 'memory_assist'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
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
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
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
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                Generate
              </button>
            </div>
          )}

          {/* STATE 2: Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
                <p className="text-slate-300 animate-pulse">
                  Claude is writing<span className="animate-[pulse_1s_ease-in-out_infinite]">...</span>
                </p>
              </div>

              {/* Skeleton Lines */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-slate-800 rounded animate-pulse"
                    style={{ width: `${Math.random() * 30 + 70}%` }}
                  />
                ))}
              </div>

              <button
                onClick={() => generateMutation.reset()}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          )}

          {/* STATE 3: Result State (confidence >= 60%) */}
          {hasGeneratedContent && confidence !== null && confidence >= 60 && (
            <div className="space-y-6">
              {/* Generated Content */}
              <div className="border-l-4 border-blue-500 bg-slate-800/50 rounded-lg p-4">
                {isEditing ? (
                  <textarea
                    value={editableContent || ''}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    rows={12}
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-200 whitespace-pre-wrap">
                      {editableContent || generatedContent}
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Indicator */}
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium ${getConfidenceLabel(confidence).color}`}>
                  {getConfidenceLabel(confidence).text} ({confidence}%)
                </div>
              </div>

              {/* MANDATORY Sources Section */}
              <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Based on {sources.length} document{sources.length !== 1 ? 's' : ''}:
                </h3>
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <div
                      key={`${source.documentId}-${source.chunkIndex}`}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-800 rounded border border-slate-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{source.documentName}</p>
                          <p className="text-xs text-slate-400">
                            Relevance: {source.score}%
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDocument(source.documentId)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={isEditing ? () => setIsEditing(false) : handleEdit}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit'}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: Low Confidence State (confidence < 60%) */}
          {hasLowConfidence && confidence !== null && confidence < 60 && (
            <div className="space-y-6">
              {/* Warning Banner */}
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-400 mb-1">
                    Cannot confidently generate content
                  </h3>
                  <p className="text-sm text-amber-300/80">
                    {lowConfidenceMessage ||
                      "The retrieved documents don't have strong enough matches. Here are the closest sources for manual review:"}
                  </p>
                  <p className="text-xs text-amber-300/60 mt-2">
                    Confidence score: {confidence}% (minimum required: 60%)
                  </p>
                </div>
              </div>

              {/* Source List */}
              {sources.length > 0 && (
                <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Closest sources ({sources.length} found):
                  </h3>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <div
                        key={`${source.documentId}-${source.chunkIndex}`}
                        className="flex items-start gap-3 p-3 bg-slate-800 rounded border border-slate-700"
                      >
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-white">{source.documentName}</p>
                            <span className="text-xs text-slate-400">
                              {source.score}% match
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {source.text.slice(0, 150)}...
                          </p>
                          <button
                            onClick={() => handleViewDocument(source.documentId)}
                            className="flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View document
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Write Button */}
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Write manually using these sources
              </button>

              {/* Regenerate Option */}
              <button
                onClick={handleRegenerate}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Try with a different prompt
              </button>
            </div>
          )}

          {/* STATE 5: Error State */}
          {hasError && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-400 mb-1">Generation failed</h3>
                  <p className="text-sm text-red-300/80">
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
