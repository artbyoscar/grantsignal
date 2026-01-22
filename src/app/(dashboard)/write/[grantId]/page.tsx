'use client'

import { useState, useEffect, useRef, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
  Search,
  Sparkles,
  Eye,
  Building2,
  Award,
  Lightbulb,
  Download,
  AlertCircle,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import { MemorySearch } from '@/components/writing/memory-search'
import { AIGenerationPanel, type Source } from '@/components/writing/ai-generation-panel'
import { Button } from '@/components/ui/button'
import { FitScoreCard } from '@/components/discovery/fit-score-card'
import { VoiceConsistencyIndicator } from '@/components/writing/voice-consistency-indicator'
import { ApplyVoiceModal } from '@/components/writing/apply-voice-modal'
import { AssigneeSelector } from '@/components/grants/assignee-selector'

interface PageProps {
  params: Promise<{
    grantId: string
  }>
}

type WritingMode = 'memory_assist' | 'ai_draft' | 'human_first' | 'audit_mode'
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface Requirement {
  section: string
  description: string
  wordLimit?: number
  required: boolean
  order: number
}

interface SectionContent {
  content: string
  isAiGenerated: boolean
  lastModified?: string
  addressed?: boolean
  aiSources?: Source[]
  aiInteractions?: Array<{
    timestamp: string
    prompt: string
    mode: WritingMode
    confidence?: number
  }>
}

export default function WritingStudioPage({ params }: PageProps) {
  const { grantId } = use(params)
  const router = useRouter()
  const [writingMode, setWritingMode] = useState<WritingMode>('memory_assist')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [currentSection, setCurrentSection] = useState<string>('')
  const [sectionContents, setSectionContents] = useState<Record<string, SectionContent>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showApplyVoiceModal, setShowApplyVoiceModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  // Panel states
  const [leftPanelWidth, setLeftPanelWidth] = useState(40) // percentage
  const [requirementsOpen, setRequirementsOpen] = useState(true)
  const [memoryAssistOpen, setMemoryAssistOpen] = useState(true)
  const [funderIntelOpen, setFunderIntelOpen] = useState(true)
  const [showMobileReferencePanel, setShowMobileReferencePanel] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Fetch grant data
  const { data: rawGrant, isLoading: isLoadingGrant } = api.grants.byId.useQuery({
    id: grantId,
  })

  // Transform Decimal to number at the boundary
  const grant = rawGrant ? {
    ...rawGrant,
    amountRequested: rawGrant.amountRequested ? Number(rawGrant.amountRequested) : null,
    amountAwarded: rawGrant.amountAwarded ? Number(rawGrant.amountAwarded) : null,
  } : null

  // Fetch draft content
  const { data: draftData, refetch: refetchDraft } = api.writing.getGrantDraft.useQuery({
    grantId: grantId,
  })

  // Load draft content
  useEffect(() => {
    if (draftData?.sections) {
      setSectionContents(draftData.sections)
      const sections = Object.keys(draftData.sections)
      if (sections.length > 0 && !currentSection) {
        setCurrentSection(sections[0])
      }
    }
  }, [draftData, currentSection])

  // Auto-save logic
  useEffect(() => {
    if (!hasUnsavedChanges || !currentSection) return

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
  }, [sectionContents, hasUnsavedChanges, currentSection])

  // Parse requirements from opportunity
  const requirements = useMemo(() => {
    try {
      const reqs = grant?.opportunity?.requirements
      if (!Array.isArray(reqs)) return []

      const parsedReqs = reqs
        .filter((req) => req && typeof req === 'object')
        .map((req: any, idx: number) => ({
          section: String(req.section || `Section ${idx + 1}`),
          description: String(req.description || ''),
          wordLimit: typeof req.wordLimit === 'number' ? req.wordLimit : undefined,
          required: req.required !== false,
          order: typeof req.order === 'number' ? req.order : idx,
        }))

      // Set initial section if not set
      if (parsedReqs.length > 0 && !currentSection) {
        setCurrentSection(parsedReqs[0].section)
        if (!sectionContents[parsedReqs[0].section]) {
          setSectionContents(prev => ({
            ...prev,
            [parsedReqs[0].section]: {
              content: '',
              isAiGenerated: false,
              addressed: false,
            },
          }))
        }
      }

      return parsedReqs.sort((a, b) => a.order - b.order)
    } catch {
      return []
    }
  }, [grant, currentSection, sectionContents])

  // Calculate word counts
  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  const totalWordCount = useMemo(() => {
    return Object.values(sectionContents).reduce(
      (sum, section) => sum + wordCount(section.content),
      0
    )
  }, [sectionContents])

  const currentSectionWordCount = useMemo(() => {
    return wordCount(sectionContents[currentSection]?.content || '')
  }, [sectionContents, currentSection])

  // Save content mutation
  const saveContentMutation = api.writing.saveContent.useMutation({
    onSuccess: () => {
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      void refetchDraft()
    },
    onError: (error) => {
      setSaveStatus('error')
      toast.error(`Save failed: ${error.message}`)
    },
  })

  // Handle AI content acceptance from panel
  const handleAcceptAiContent = (content: string, sources: Source[]) => {
    setSectionContents(prev => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        content: prev[currentSection]?.content ? prev[currentSection].content + '\n\n' + content : content,
        isAiGenerated: true,
        lastModified: new Date().toISOString(),
        aiSources: [...(prev[currentSection]?.aiSources || []), ...sources],
        aiInteractions: [
          ...(prev[currentSection]?.aiInteractions || []),
          {
            timestamp: new Date().toISOString(),
            prompt: aiPrompt,
            mode: writingMode,
          },
        ],
      },
    }))
    setHasUnsavedChanges(true)
    setShowAiPanel(false)
    setAiPrompt('')
  }

  const handleSave = () => {
    if (!hasUnsavedChanges || !currentSection) return

    setSaveStatus('saving')
    const sectionData = sectionContents[currentSection]

    saveContentMutation.mutate({
      grantId: grantId,
      sectionName: currentSection,
      content: sectionData.content,
      isAiGenerated: sectionData.isAiGenerated || false,
    })
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSectionContents(prev => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        content: e.target.value,
      },
    }))
    setHasUnsavedChanges(true)
  }

  const handleOpenAiPanel = () => {
    if (!currentSection) {
      toast.error('Please select a section first')
      return
    }
    setShowAiPanel(true)
  }

  const handleQuickAction = (action: 'draft' | 'examples' | 'consistency') => {
    if (!currentSection) {
      toast.error('Please select a section first')
      return
    }
    const prompts = {
      draft: `Draft the ${currentSection} section using our organizational context`,
      examples: `Find examples of similar content from our past proposals`,
      consistency: `Review this section for consistency with our organizational voice and mission`,
    }
    setAiPrompt(prompts[action])
    setShowAiPanel(true)
  }

  const handleApplyVoice = () => {
    if (!currentSection) {
      toast.error('Please select a section first')
      return
    }

    // Get selected text from textarea
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value.substring(start, end)

    if (!text || text.trim().length < 10) {
      toast.error('Please select at least 10 characters of text to apply voice')
      return
    }

    setSelectedText(text)
    setShowApplyVoiceModal(true)
  }

  const handleVoiceApplied = (rewrittenText: string) => {
    if (!currentSection || !textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = textarea.value

    // Replace selected text with rewritten text
    const newContent =
      currentContent.substring(0, start) + rewrittenText + currentContent.substring(end)

    setSectionContents(prev => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        content: newContent,
        lastModified: new Date().toISOString(),
      },
    }))

    setHasUnsavedChanges(true)

    // Set cursor position after rewritten text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + rewrittenText.length, start + rewrittenText.length)
    }, 0)
  }

  const handleMemoryInsert = (
    text: string,
    source: { documentId: string; documentName: string }
  ) => {
    const insertText = `\n\n[From ${source.documentName}]\n${text}\n`
    const currentContent = sectionContents[currentSection]?.content || ''

    // Track as AI-assisted content with source
    setSectionContents(prev => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        content: currentContent + insertText,
        isAiGenerated: true,
        lastModified: new Date().toISOString(),
        aiSources: [
          ...(prev[currentSection]?.aiSources || []),
          {
            documentId: source.documentId,
            documentName: source.documentName,
            text,
            score: 100, // Manual insert = 100% relevance
            chunkIndex: 0,
          },
        ],
      },
    }))
    setHasUnsavedChanges(true)
  }

  const handleToggleAddressed = (section: string) => {
    setSectionContents(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        addressed: !prev[section]?.addressed,
      },
    }))
    setHasUnsavedChanges(true)
  }

  const handleSectionChange = (section: string) => {
    // Save current section before switching
    if (hasUnsavedChanges && currentSection) {
      handleSave()
    }
    setCurrentSection(section)
    if (!sectionContents[section]) {
      setSectionContents(prev => ({
        ...prev,
        [section]: {
          content: '',
          isAiGenerated: false,
          addressed: false,
        },
      }))
    }
  }

  // Keyboard shortcuts (Cmd+S for manual save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges && currentSection) {
          handleSave()
          toast.success('Manual save triggered')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, currentSection])

  // Resizable panel logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return

      const container = resizeRef.current.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newWidth >= 25 && newWidth <= 60) {
        setLeftPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const handleMouseDown = () => {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const resizeElement = resizeRef.current
    if (resizeElement) {
      resizeElement.addEventListener('mousedown', handleMouseDown)
      return () => {
        resizeElement.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [])

  if (isLoadingGrant) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!grant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-900">
        <p className="text-slate-400">Grant not found</p>
        <Button onClick={() => router.push('/pipeline')}>Back to Pipeline</Button>
      </div>
    )
  }

  const currentSectionData = sectionContents[currentSection]
  const currentRequirement = requirements.find(r => r.section === currentSection)

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => router.push('/pipeline')} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Back to Pipeline</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-bold text-white truncate">
              {grant.opportunity?.title || 'Untitled Grant'}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 truncate">{grant.funder?.name || 'Unknown Funder'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {/* Assignee Selector - Hidden on small mobile */}
          <div className="hidden sm:block min-w-[160px] md:min-w-[200px]">
            <AssigneeSelector
              grantId={grantId}
              currentAssignee={grant.assignedTo}
              variant="full"
              onAssignmentChange={() => {
                // Refetch grant data to update the assignee
              }}
            />
          </div>
          {/* Writing Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 overflow-x-auto">
            {(['memory_assist', 'ai_draft', 'human_first', 'audit_mode'] as WritingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setWritingMode(mode)}
                className={`
                  px-2 md:px-3 py-1.5 rounded text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap
                  ${writingMode === mode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'}
                `}
              >
                {mode === 'memory_assist' && <span className="hidden sm:inline">Memory Assist</span>}
                {mode === 'memory_assist' && <span className="sm:hidden">Memory</span>}
                {mode === 'ai_draft' && <span className="hidden sm:inline">AI Draft</span>}
                {mode === 'ai_draft' && <span className="sm:hidden">AI</span>}
                {mode === 'human_first' && <span className="hidden sm:inline">Human First</span>}
                {mode === 'human_first' && <span className="sm:hidden">Human</span>}
                {mode === 'audit_mode' && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Audit Mode</span>
                    <span className="sm:hidden">Audit</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Audit Mode Export */}
          {writingMode === 'audit_mode' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Generate audit report
                const aiUsage = Object.entries(sectionContents)
                  .filter(([_, content]) => content.isAiGenerated || content.aiSources?.length)
                  .map(([section, content]) => ({
                    section,
                    interactions: content.aiInteractions?.length || 0,
                    sources: content.aiSources?.length || 0,
                    sourcesList: content.aiSources?.map(s => s.documentName) || [],
                  }))

                const report = {
                  grantId: grantId,
                  grantTitle: grant?.opportunity?.title || 'Untitled',
                  exportedAt: new Date().toISOString(),
                  totalSections: Object.keys(sectionContents).length,
                  aiAssistedSections: aiUsage.length,
                  sections: aiUsage,
                }

                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ai-usage-report-${grantId}-${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('AI usage report exported')
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export AI Report
            </Button>
          )}

          {/* Save Status */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs md:text-sm ${
                saveStatus === 'saved'
                  ? 'text-green-400'
                  : saveStatus === 'saving'
                  ? 'text-blue-400'
                  : saveStatus === 'unsaved'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'unsaved' && 'Unsaved'}
              {saveStatus === 'error' && 'Error'}
            </span>
          </div>

          {/* Voice Consistency Indicator - Hidden on small mobile */}
          {currentSection && currentSectionData?.content && (
            <div className="hidden md:block">
              <VoiceConsistencyIndicator
                text={currentSectionData.content}
                className="ml-2"
              />
            </div>
          )}

          {/* Word Count */}
          <div className="text-xs md:text-sm text-slate-400 whitespace-nowrap">
            {totalWordCount.toLocaleString()}w
          </div>
        </div>
      </div>

      {/* Main Content Area - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Reference Panel - Hidden on mobile */}
        <div
          className="hidden lg:block overflow-y-auto border-r border-slate-700 bg-slate-900"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="p-4 space-y-4">
            {/* RFP Requirements Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <button
                onClick={() => setRequirementsOpen(!requirementsOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">RFP Requirements</h3>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
                    {requirements.length}
                  </span>
                </div>
                {requirementsOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {requirementsOpen && (
                <div className="p-4 pt-0 space-y-2">
                  {requirements.map((req) => (
                    <div
                      key={req.section}
                      onClick={() => handleSectionChange(req.section)}
                      className={`
                        p-3 rounded-lg border transition-all cursor-pointer
                        ${
                          currentSection === req.section
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-900'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleAddressed(req.section)
                            }}
                            className={`
                              mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-colors
                              ${
                                sectionContents[req.section]?.addressed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-slate-600 hover:border-slate-500'
                              }
                            `}
                          >
                            {sectionContents[req.section]?.addressed && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white">
                              {req.section}
                              {req.required && <span className="text-red-400 ml-1">*</span>}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {req.description}
                            </p>
                          </div>
                        </div>
                        {req.wordLimit && (
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {req.wordLimit}w
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Memory Assist Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <button
                onClick={() => setMemoryAssistOpen(!memoryAssistOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Memory Assist</h3>
                </div>
                {memoryAssistOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {memoryAssistOpen && (
                <div className="p-4 pt-0">
                  <MemorySearch onInsert={handleMemoryInsert} />
                </div>
              )}
            </div>

            {/* Funder Intelligence Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <button
                onClick={() => setFunderIntelOpen(!funderIntelOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-white font-semibold">Funder Intelligence</h3>
                </div>
                {funderIntelOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {funderIntelOpen && grant.funder && (
                <div className="p-4 pt-0 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">
                        {grant.funder.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Type: {grant.funder.type.replace(/_/g, ' ')}
                    </p>
                  </div>

                  {(grant.funder.grantSizeMin || grant.funder.grantSizeMax) && (
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5">$</div>
                      <div>
                        <p className="text-xs text-slate-400">Average Grant Size</p>
                        <p className="text-sm text-white font-medium">
                          {grant.funder.grantSizeMin &&
                            new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                            }).format(Number(grant.funder.grantSizeMin))}
                          {grant.funder.grantSizeMin && grant.funder.grantSizeMax && ' - '}
                          {grant.funder.grantSizeMax &&
                            new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                            }).format(Number(grant.funder.grantSizeMax))}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white mb-1">Tips</p>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                          <li>Emphasize measurable outcomes</li>
                          <li>Include community impact data</li>
                          <li>Align with funder priorities</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fit Score Section */}
            {grant.opportunity && grant.opportunity.fitScores && grant.opportunity.fitScores.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Opportunity Fit Score
                  </h3>
                </div>
                <FitScoreCard
                  opportunityId={grant.opportunityId!}
                  variant="compact"
                  initialData={{
                    overallScore: grant.opportunity.fitScores[0].overallScore,
                    missionScore: grant.opportunity.fitScores[0].missionScore,
                    capacityScore: grant.opportunity.fitScores[0].capacityScore,
                    geographicScore: grant.opportunity.fitScores[0].geographicScore,
                    historicalScore: grant.opportunity.fitScores[0].historyScore,
                    reusableContentPercentage: 0,
                    estimatedHours: grant.opportunity.fitScores[0].estimatedHours || 0,
                    strengths: (grant.opportunity.fitScores[0].reusableContent as any)?.strengths || [],
                    concerns: (grant.opportunity.fitScores[0].reusableContent as any)?.concerns || [],
                    recommendations: (grant.opportunity.fitScores[0].reusableContent as any)?.recommendations || [],
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle - Hidden on mobile */}
        <div
          ref={resizeRef}
          className="hidden lg:block w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors"
        />

        {/* Right Editor Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-800">
          {/* Section Navigation Tabs */}
          {requirements.length > 0 && (
            <div className="flex items-center gap-1 p-2 border-b border-slate-700 overflow-x-auto scrollbar-thin">
              {requirements.map((req) => (
                <button
                  key={req.section}
                  onClick={() => handleSectionChange(req.section)}
                  className={`
                    px-2 md:px-3 py-1.5 rounded text-[10px] md:text-xs font-medium whitespace-nowrap transition-colors
                    ${
                      currentSection === req.section
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                    }
                  `}
                >
                  {req.section}
                  {sectionContents[req.section]?.addressed && (
                    <Check className="inline-block w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 p-3 md:p-4 overflow-y-auto">
            {currentRequirement && (
              <div className="mb-3 md:mb-4 p-3 bg-slate-900 border border-slate-700 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-white mb-1">
                      {currentRequirement.section}
                      {currentRequirement.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-400 line-clamp-2">
                      {currentRequirement.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] md:text-xs text-slate-400">
                      {currentSectionWordCount} / {currentRequirement.wordLimit || '∞'}
                    </div>
                    {currentRequirement.wordLimit &&
                      currentSectionWordCount > currentRequirement.wordLimit && (
                        <div className="text-[10px] md:text-xs text-amber-400 mt-1">Over</div>
                      )}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`
                relative min-h-full
                ${currentSectionData?.isAiGenerated || currentSectionData?.aiSources?.length ? 'border-l-4 border-blue-500 pl-4' : ''}
              `}
            >
              {(currentSectionData?.isAiGenerated || currentSectionData?.aiSources?.length) && (
                <div className="absolute -left-4 top-0 flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-r shadow-md">
                    <Sparkles className="w-3 h-3" />
                    AI Assisted
                  </span>
                  {writingMode === 'audit_mode' && currentSectionData?.aiSources && (
                    <>
                      <div className="bg-slate-100 border-l-2 border-blue-500 rounded-r px-2 py-1 text-xs text-slate-700 shadow-sm">
                        <div className="font-medium">{currentSectionData.aiSources.length} source{currentSectionData.aiSources.length !== 1 ? 's' : ''}</div>
                        {currentSectionData.aiInteractions && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {currentSectionData.aiInteractions.length} interaction{currentSectionData.aiInteractions.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {/* Average Confidence */}
                      {currentSectionData.aiSources.length > 0 && (
                        <div className="bg-slate-100 border-l-2 border-green-500 rounded-r px-2 py-1 text-xs shadow-sm">
                          <div className="text-slate-500 text-[10px]">Avg Confidence</div>
                          <div className="font-medium text-green-700">
                            {Math.round(
                              currentSectionData.aiSources.reduce((sum, s) => sum + s.score, 0) /
                              currentSectionData.aiSources.length
                            )}%
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* AI Source Attribution (Audit Mode) */}
              {writingMode === 'audit_mode' && currentSectionData?.aiSources && currentSectionData.aiSources.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-900">Trust Architecture: AI Sources Used</h4>
                  </div>
                  <div className="space-y-2">
                    {currentSectionData.aiSources.map((source, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-white rounded border border-blue-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-slate-900 truncate">{source.documentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            source.score >= 80 ? 'bg-green-100 text-green-700' :
                            source.score >= 60 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {source.score}%
                          </span>
                          <button
                            onClick={() => window.open(`/documents/${source.documentId}`, '_blank')}
                            className="text-blue-600 hover:text-blue-700 text-xs underline"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Audit Trail Info */}
                  {currentSectionData.aiInteractions && currentSectionData.aiInteractions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-xs text-slate-600 mb-2 font-medium">
                        AI Interaction History:
                      </div>
                      <div className="space-y-1.5">
                        {currentSectionData.aiInteractions.map((interaction, idx) => (
                          <div key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-slate-400">•</span>
                            <div className="flex-1">
                              <span className="font-medium">{interaction.mode.replace('_', ' ')}:</span>{' '}
                              {interaction.prompt.slice(0, 60)}
                              {interaction.prompt.length > 60 ? '...' : ''}
                              {interaction.confidence && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                  interaction.confidence >= 80 ? 'bg-green-100 text-green-700' :
                                  interaction.confidence >= 60 ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {interaction.confidence}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trust Architecture Info */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-700">
                      All AI-generated content is tracked per GrantSignal Trust Architecture.
                      Confidence thresholds enforced: ≥80% (high), 60-79% (medium), &lt;60% (blocked).
                    </p>
                  </div>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={currentSectionData?.content || ''}
                onChange={handleContentChange}
                placeholder={`Start writing the ${currentSection} section...`}
                disabled={isGenerating}
                className="w-full min-h-[400px] md:min-h-[600px] bg-slate-900 border border-slate-700 rounded-lg p-3 md:p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm md:text-base leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom AI Action Bar */}
      <div className="border-t border-slate-700 bg-slate-800 p-2 md:p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Ask Claude to help..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleOpenAiPanel()
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              onClick={() => handleQuickAction('draft')}
              disabled={!currentSection}
              className="gap-1 md:gap-2 flex-shrink-0 text-xs"
            >
              <FileText className="w-3 md:w-4 h-3 md:h-4" />
              <span className="hidden sm:inline">Draft Section</span>
              <span className="sm:hidden">Draft</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction('examples')}
              disabled={!currentSection}
              className="gap-1 md:gap-2 flex-shrink-0 text-xs"
            >
              <Search className="w-3 md:w-4 h-3 md:h-4" />
              <span className="hidden sm:inline">Find Examples</span>
              <span className="sm:hidden">Examples</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction('consistency')}
              disabled={!currentSection}
              className="gap-1 md:gap-2 flex-shrink-0 text-xs hidden md:flex"
            >
              <Eye className="w-3 md:w-4 h-3 md:h-4" />
              <span className="hidden sm:inline">Check Consistency</span>
              <span className="sm:hidden">Check</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleApplyVoice}
              disabled={!currentSection}
              className="gap-1 md:gap-2 flex-shrink-0 text-xs bg-blue-600/10 border-blue-500/30 hover:bg-blue-600/20"
              title="Apply your organization's voice to selected text"
            >
              <Volume2 className="w-3 md:w-4 h-3 md:h-4" />
              <span className="hidden sm:inline">Apply Voice</span>
              <span className="sm:hidden">Voice</span>
            </Button>

            <button
              onClick={handleOpenAiPanel}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
              title="Open AI panel"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Generation Panel */}
      {showAiPanel && currentSection && (
        <AIGenerationPanel
          grantId={grantId}
          sectionName={currentSection}
          onAccept={handleAcceptAiContent}
          onClose={() => setShowAiPanel(false)}
        />
      )}

      {/* Apply Voice Modal */}
      {showApplyVoiceModal && selectedText && (
        <ApplyVoiceModal
          selectedText={selectedText}
          onApply={handleVoiceApplied}
          onClose={() => {
            setShowApplyVoiceModal(false)
            setSelectedText('')
          }}
        />
      )}
    </div>
  )
}
