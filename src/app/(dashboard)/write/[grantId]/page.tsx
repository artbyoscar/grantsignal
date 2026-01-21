'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { RequirementsPanel } from '@/components/writing/requirements-panel'
import { EditorToolbar } from '@/components/writing/editor-toolbar'
import {
  AIGenerationPanel,
  type GenerationResult,
} from '@/components/writing/ai-generation-panel'
import { MemorySearch, type MemorySearchResult } from '@/components/shared/memory-search'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: {
    grantId: string
  }
}

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export default function WritingStudioPage({ params }: PageProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [prompt, setPrompt] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: grant, isLoading: isLoadingGrant } = api.grants.byId.useQuery({
    id: params.grantId,
  })

  const updateGrantMutation = api.grants.update.useMutation({
    onSuccess: () => {
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      toast.success('Content saved')
    },
    onError: (error) => {
      setSaveStatus('error')
      toast.error(`Save failed: ${error.message}`)
    },
  })

  const generateMutation = api.ai.generate.useMutation({
    onSuccess: (result) => {
      setGenerationResult(result)
      toast.success('Content generated!')
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`)
    },
  })

  useEffect(() => {
    if (grant?.notes) {
      setContent(grant.notes)
    }
  }, [grant])

  useEffect(() => {
    if (!hasUnsavedChanges || updateGrantMutation.isPending) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus('unsaved')
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    if (!hasUnsavedChanges) return

    setSaveStatus('saving')
    updateGrantMutation.mutate({
      id: params.grantId,
      notes: content,
    })
  }

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    generateMutation.mutate({
      prompt,
      grantId: params.grantId,
      mode: 'generate',
      existingContent: content || undefined,
    })
  }

  const handleRefine = () => {
    if (!content.trim()) {
      toast.error('No content to refine')
      return
    }

    const refinePrompt = prompt.trim() || 'Refine and improve this content'

    generateMutation.mutate({
      prompt: refinePrompt,
      grantId: params.grantId,
      mode: 'refine',
      existingContent: content,
    })
  }

  const handleExpand = () => {
    if (!content.trim()) {
      toast.error('No content to expand')
      return
    }

    const expandPrompt =
      prompt.trim() || 'Expand on this content with more detail'

    generateMutation.mutate({
      prompt: expandPrompt,
      grantId: params.grantId,
      mode: 'expand',
      existingContent: content,
    })
  }

  const handleInsertContent = (generatedContent: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent(content + '\n\n' + generatedContent)
      setHasUnsavedChanges(true)
      setGenerationResult(null)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)

    const newContent = before + generatedContent + after
    setContent(newContent)
    setHasUnsavedChanges(true)
    setGenerationResult(null)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + generatedContent.length,
        start + generatedContent.length
      )
    }, 0)
  }

  const handleMemoryInsert = (result: MemorySearchResult) => {
    const insertText = `\n\n[From ${result.documentName}]\n${result.text}\n`

    const textarea = textareaRef.current
    if (!textarea) {
      setContent(content + insertText)
      setHasUnsavedChanges(true)
      toast.success('Content inserted')
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)

    const newContent = before + insertText + after
    setContent(newContent)
    setHasUnsavedChanges(true)
    toast.success('Content inserted')

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + insertText.length,
        start + insertText.length
      )
    }, 0)
  }

  if (isLoadingGrant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!grant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-slate-400">Grant not found</p>
        <Button onClick={() => router.push('/pipeline')}>
          Back to Pipeline
        </Button>
      </div>
    )
  }

  const requirements = (() => {
    try {
      const reqs = grant.opportunity?.requirements
      if (!Array.isArray(reqs)) return []

      return reqs
        .filter((req) => req && typeof req === 'object')
        .map((req, idx) => ({
          section: String(req.section || 'Section'),
          description: String(req.description || ''),
          wordLimit:
            typeof req.wordLimit === 'number' ? req.wordLimit : undefined,
          required: req.required !== false,
          order: typeof req.order === 'number' ? req.order : idx,
        }))
    } catch {
      return []
    }
  })()

  const isGenerating = generateMutation.isPending
  const isSaving = updateGrantMutation.isPending

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pipeline')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Writing Studio</h1>
            <p className="text-sm text-slate-400">
              {grant.funder?.name || 'Untitled Grant'}
              {grant.opportunity && ` • ${grant.opportunity.title}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <div className="w-2/5 space-y-4 overflow-y-auto">
          {grant.opportunity && (
            <RequirementsPanel
              requirements={requirements}
              opportunityTitle={grant.opportunity.title}
              deadline={grant.opportunity.deadline || undefined}
              fundingRange={{
                min: grant.opportunity.amountMin
                  ? Number(grant.opportunity.amountMin)
                  : undefined,
                max: grant.opportunity.amountMax
                  ? Number(grant.opportunity.amountMax)
                  : undefined,
              }}
            />
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Memory Assist</h3>
            <MemorySearch
              onInsert={handleMemoryInsert}
              placeholder="Search organizational memory..."
            />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Grant Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="text-white">{grant.status}</span>
              </div>
              {grant.amountRequested && (
                <div>
                  <span className="text-slate-400">Amount Requested:</span>{' '}
                  <span className="text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(Number(grant.amountRequested))}
                  </span>
                </div>
              )}
              {grant.deadline && (
                <div>
                  <span className="text-slate-400">Deadline:</span>{' '}
                  <span className="text-white">
                    {new Date(grant.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-3/5 flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <EditorToolbar
            onGenerate={handleGenerate}
            onRefine={handleRefine}
            onExpand={handleExpand}
            onSave={handleSave}
            isGenerating={isGenerating}
            isSaving={isSaving}
            saveStatus={saveStatus}
            hasContent={content.length > 0}
          />

          <div className="p-4 border-b border-slate-700">
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-white mb-2"
            >
              AI Prompt
            </label>
            <input
              id="prompt"
              type="text"
              placeholder="E.g., 'Write a project narrative describing our after-school programs'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
            />
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing or use AI to generate content..."
              disabled={isGenerating || isSaving}
              className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          {generationResult && (
            <div className="border-t border-slate-700 p-4">
              <AIGenerationPanel
                result={generationResult}
                onInsert={handleInsertContent}
                onRegenerate={handleGenerate}
                onDismiss={() => setGenerationResult(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
