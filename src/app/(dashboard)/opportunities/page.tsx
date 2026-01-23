'use client'

import { useState, useRef } from 'react'
import { Search, Upload, Zap, Database, Brain, ExternalLink, Loader2, CheckCircle2, AlertCircle, Filter, SlidersHorizontal, Calendar, TrendingUp, Clock, Building2, X, Grid3x3, List, ChevronRight, ChevronDown, DollarSign, MapPin, Tag } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'
import { FitScoreCard } from '@/components/fit-score-card'
import { ResearchFunderModal } from '@/components/funders/research-funder-modal'
import { uploadToS3 } from '@/lib/upload'
import { toast } from 'sonner'

type AnalysisStep = 'idle' | 'parsing' | 'scoring' | 'complete' | 'error'

interface ParsedRFP {
  title: string
  description: string
  deadline?: Date
  amountMin?: number
  amountMax?: number
  requirements: Array<{
    section: string
    description: string
    wordLimit: number
  }>
  eligibility: string[]
  confidence: number
  source: string
}

interface FitScore {
  overallScore: number
  missionScore: number
  capacityScore: number
  geographicScore: number
  historyScore: number
  estimatedHours: number
  reusableContent: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    relevantDocuments: Array<{
      id: string
      name: string
      type: string
      relevance: string
    }>
  }
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type UploadingFile = {
  file: File
  progress: number
  status: 'uploading' | 'parsing' | 'complete' | 'error'
  error?: string
}

type ViewMode = 'grid' | 'list'

const FUNDER_TYPES = [
  { value: 'PRIVATE_FOUNDATION', label: 'Private Foundation' },
  { value: 'COMMUNITY_FOUNDATION', label: 'Community Foundation' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'FEDERAL', label: 'Federal' },
  { value: 'STATE', label: 'State' },
] as const

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

const PROGRAM_AREAS = [
  'Education',
  'Health',
  'Environment',
  'Arts & Culture',
  'Human Services',
  'Community Development',
  'Economic Development',
  'Youth Development',
  'Senior Services',
  'Housing',
]

export default function OpportunitiesPage() {
  const router = useRouter()
  const [inputUrl, setInputUrl] = useState('')
  const [inputText, setInputText] = useState('')
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedRfp, setParsedRfp] = useState<ParsedRFP | null>(null)
  const [fitScore, setFitScore] = useState<FitScore | null>(null)
  const [showResearchModal, setShowResearchModal] = useState(false)

  // File upload state
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Opportunity list state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'deadline' | 'fitScore' | 'createdAt'>('deadline')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [minFitScore, setMinFitScore] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [showAnalyze, setShowAnalyze] = useState(false)

  // Filter state
  const [selectedFunderTypes, setSelectedFunderTypes] = useState<string[]>([])
  const [amountMin, setAmountMin] = useState<number | undefined>()
  const [amountMax, setAmountMax] = useState<number | undefined>()
  const [deadlinePreset, setDeadlinePreset] = useState<'30' | '60' | '90' | 'custom' | ''>('')
  const [deadlineFrom, setDeadlineFrom] = useState<Date | undefined>()
  const [deadlineTo, setDeadlineTo] = useState<Date | undefined>()
  const [selectedProgramAreas, setSelectedProgramAreas] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])

  const parseRfpMutation = api.discovery.parseRfp.useMutation()
  const calculateFitMutation = api.discovery.calculateFitScore.useMutation()
  const saveOpportunityMutation = api.discovery.saveOpportunity.useMutation()
  const createRfpUploadUrlMutation = api.discovery.createRfpUploadUrl.useMutation()
  const parseRfpFileMutation = api.discovery.parseRfpFile.useMutation()

  // Calculate deadline range based on preset
  const getDeadlineRange = () => {
    if (deadlinePreset === 'custom') {
      return { from: deadlineFrom, to: deadlineTo }
    }
    if (deadlinePreset) {
      const now = new Date()
      const to = new Date()
      to.setDate(now.getDate() + parseInt(deadlinePreset))
      return { from: now, to }
    }
    return { from: deadlineFrom, to: deadlineTo }
  }

  const deadlineRange = getDeadlineRange()

  // Query for listing opportunities with fit scores
  const { data: opportunities, refetch: refetchOpportunities } = api.discovery.listOpportunities.useQuery(
    {
      sortBy,
      sortOrder,
      minFitScore,
      includeDeadlinePassed: false,
      search: searchQuery || undefined,
      funderTypes: selectedFunderTypes.length > 0 ? selectedFunderTypes as any : undefined,
      amountMin,
      amountMax,
      deadlineFrom: deadlineRange.from,
      deadlineTo: deadlineRange.to,
      programAreas: selectedProgramAreas.length > 0 ? selectedProgramAreas : undefined,
      states: selectedStates.length > 0 ? selectedStates : undefined,
    },
    {
      enabled: analysisStep === 'idle', // Only fetch when not analyzing
    }
  )

  const handleAnalyze = async () => {
    if (!inputUrl && !inputText) {
      setError('Please provide a URL or paste RFP text')
      return
    }

    setError(null)
    setAnalysisStep('parsing')
    setParsedRfp(null)
    setFitScore(null)

    try {
      // Step 1: Parse RFP
      const parsed = await parseRfpMutation.mutateAsync({
        url: inputUrl || undefined,
        text: inputText || undefined,
      })

      setParsedRfp(parsed)
      setAnalysisStep('scoring')

      // Step 2: Save opportunity temporarily to get an ID
      const tempOpportunity = await saveOpportunityMutation.mutateAsync({
        title: parsed.title,
        description: parsed.description,
        deadline: parsed.deadline,
        amountMin: parsed.amountMin,
        amountMax: parsed.amountMax,
        source: parsed.source,
        notes: 'Temporary analysis - not yet approved',
      })

      // Step 3: Calculate fit score for the saved opportunity
      const score = await calculateFitMutation.mutateAsync({
        opportunityId: tempOpportunity.opportunity.id,
      })

      setFitScore(score)
      setAnalysisStep('complete')

      // Refetch opportunities list to show the new one
      refetchOpportunities()
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze RFP')
      setAnalysisStep('error')
    }
  }

  const handleSaveToPipeline = async () => {
    if (!parsedRfp || !fitScore) return

    try {
      // Build notes from fit score analysis
      const notes = `Fit Score: ${fitScore.overallScore}/100
Estimated Hours: ${fitScore.estimatedHours}h

${fitScore.reusableContent.strengths.length > 0 ? `Strengths:\n${fitScore.reusableContent.strengths.map(s => `• ${s}`).join('\n')}\n\n` : ''}${fitScore.reusableContent.concerns.length > 0 ? `Concerns:\n${fitScore.reusableContent.concerns.map(c => `• ${c}`).join('\n')}\n\n` : ''}${fitScore.reusableContent.recommendations.length > 0 ? `Recommendations:\n${fitScore.reusableContent.recommendations.map(r => `• ${r}`).join('\n')}` : ''}`

      const result = await saveOpportunityMutation.mutateAsync({
        title: parsedRfp.title,
        description: parsedRfp.description,
        deadline: parsedRfp.deadline,
        amountMin: parsedRfp.amountMin,
        amountMax: parsedRfp.amountMax,
        source: parsedRfp.source,
        fitScore: fitScore.overallScore,
        notes,
      })

      // Refetch opportunities list
      refetchOpportunities()

      // Navigate to the grant detail page
      router.push(`/grants/${result.grant.id}`)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save opportunity')
    }
  }

  // File upload handlers
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0] // Only handle first file

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF or DOCX files.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 25MB limit.')
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploadingFile({
      file,
      progress: 0,
      status: 'uploading',
    })

    setError(null)
    setParsedRfp(null)
    setFitScore(null)
    setAnalysisStep('parsing')

    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, s3Key } = await createRfpUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })

      // Step 2: Upload file to S3 with progress tracking
      await uploadToS3(file, uploadUrl, (progress) => {
        setUploadingFile(prev => prev ? { ...prev, progress } : null)
      })

      // Step 3: Trigger RFP parsing
      setUploadingFile(prev => prev ? { ...prev, status: 'parsing', progress: 100 } : null)

      await parseRfpFileMutation.mutateAsync({
        s3Key,
        fileName: file.name,
      })

      // For now, simulate the parsing result
      await delay(3000)

      const parsed = await parseRfpMutation.mutateAsync({
        text: `Uploaded file: ${file.name}`,
      })

      setParsedRfp(parsed)
      setAnalysisStep('scoring')

      // Save opportunity temporarily
      const tempOpportunity = await saveOpportunityMutation.mutateAsync({
        title: parsed.title,
        description: parsed.description,
        deadline: parsed.deadline,
        amountMin: parsed.amountMin,
        amountMax: parsed.amountMax,
        source: `File: ${file.name}`,
        notes: 'Temporary analysis - not yet approved',
      })

      // Calculate fit score
      const score = await calculateFitMutation.mutateAsync({
        opportunityId: tempOpportunity.opportunity.id,
      })

      setFitScore(score)
      setAnalysisStep('complete')
      setUploadingFile(prev => prev ? { ...prev, status: 'complete' } : null)

      toast.success(`${file.name} analyzed successfully`)

      // Refetch opportunities list
      refetchOpportunities()

      // Clear uploading state after delay
      setTimeout(() => {
        setUploadingFile(null)
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'

      setUploadingFile(prev => prev ? { ...prev, status: 'error', error: errorMessage } : null)
      setError(errorMessage)
      setAnalysisStep('error')

      toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  // Filter helpers
  const toggleFunderType = (type: string) => {
    setSelectedFunderTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleProgramArea = (area: string) => {
    setSelectedProgramAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    )
  }

  const clearAllFilters = () => {
    setSelectedFunderTypes([])
    setAmountMin(undefined)
    setAmountMax(undefined)
    setDeadlinePreset('')
    setDeadlineFrom(undefined)
    setDeadlineTo(undefined)
    setSelectedProgramAreas([])
    setSelectedStates([])
    setMinFitScore(0)
    setSearchQuery('')
  }

  const activeFilterCount =
    selectedFunderTypes.length +
    (amountMin !== undefined ? 1 : 0) +
    (amountMax !== undefined ? 1 : 0) +
    (deadlinePreset !== '' ? 1 : 0) +
    selectedProgramAreas.length +
    selectedStates.length +
    (minFitScore > 0 ? 1 : 0)

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date()
    const diffTime = new Date(deadline).getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDeadlineColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-slate-500'
    if (daysRemaining <= 7) return 'text-red-400'
    if (daysRemaining <= 30) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const isAnalyzing = analysisStep === 'parsing' || analysisStep === 'scoring'
  const hasInput = Boolean(inputUrl || inputText)
  const isUploading = uploadingFile?.status === 'uploading' || uploadingFile?.status === 'parsing'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Smart Discovery</h1>
          <p className="text-slate-400 mt-1">Find and analyze grant opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnalyze(!showAnalyze)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Analyze New RFP
          </button>
          <button
            onClick={() => setShowResearchModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Research Funder
          </button>
        </div>
      </div>

      {/* Research Funder Modal */}
      <ResearchFunderModal
        isOpen={showResearchModal}
        onClose={() => setShowResearchModal(false)}
      />

      {/* Analyze Section (Collapsible) */}
      {showAnalyze && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Analyze Opportunity</h2>
            <button
              onClick={() => setShowAnalyze(false)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Paste a grant URL or upload an RFP document to get instant fit analysis.
          </p>

          {/* URL Input */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Paste grant URL or RFP link..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value)
                  setInputText('') // Clear text if URL is provided
                }}
                disabled={isAnalyzing}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!hasInput || isAnalyzing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Text Input Area */}
          <textarea
            placeholder="Or paste the full RFP text here..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors min-h-[150px] mb-4"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              setInputUrl('') // Clear URL if text is provided
            }}
            disabled={isAnalyzing}
          />

          {/* Upload Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : isUploading
                ? 'border-slate-600 bg-slate-900 cursor-wait'
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-900'
            } ${isAnalyzing && !isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={isAnalyzing}
              className="hidden"
            />

            {isUploading && uploadingFile ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
                <div>
                  <p className="text-slate-300 font-medium">{uploadingFile.file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {uploadingFile.status === 'uploading'
                      ? `Uploading... ${uploadingFile.progress}%`
                      : 'Processing RFP...'}
                  </p>
                </div>
                {uploadingFile.status === 'uploading' && (
                  <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">
                  {isDragging ? 'Drop RFP file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-500 mt-1">PDF, DOCX up to 25MB</p>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium">Analysis Failed</p>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing RFP...</h3>
            <p className="text-slate-400 mb-6">This may take a few moments</p>

            {/* Progress Steps */}
            <div className="w-full max-w-md space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                analysisStep === 'parsing' ? 'bg-blue-900/30 border border-blue-800' : 'bg-slate-900'
              }`}>
                {analysisStep === 'parsing' ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-white font-medium">Extracting text</p>
                  <p className="text-sm text-slate-400">Reading RFP content</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                analysisStep === 'scoring' ? 'bg-blue-900/30 border border-blue-800' :
                ['complete', 'error'].includes(analysisStep as string) ? 'bg-slate-900' : 'bg-slate-900 opacity-50'
              }`}>
                {analysisStep === 'scoring' ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                ) : ['complete', 'error'].includes(analysisStep as string) ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-white font-medium">Calculating fit</p>
                  <p className="text-sm text-slate-400">Analyzing against your profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {analysisStep === 'complete' && parsedRfp && fitScore && (
        <div className="space-y-6">
          {/* Parsed RFP Details */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{parsedRfp.title}</h2>
                <p className="text-slate-400 text-sm mb-4">{parsedRfp.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {parsedRfp.deadline && (
                    <div>
                      <span className="text-slate-500">Deadline:</span>
                      <span className="text-white ml-2">{new Date(parsedRfp.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {(parsedRfp.amountMin || parsedRfp.amountMax) && (
                    <div>
                      <span className="text-slate-500">Amount:</span>
                      <span className="text-white ml-2">
                        {parsedRfp.amountMin && `$${parsedRfp.amountMin.toLocaleString()}`}
                        {parsedRfp.amountMin && parsedRfp.amountMax && ' - '}
                        {parsedRfp.amountMax && `$${parsedRfp.amountMax.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Confidence:</span>
                    <span className="text-emerald-400 ml-2">{Math.round(parsedRfp.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fit Score Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-6">
              {/* Circular Progress */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - fitScore.overallScore / 100)}`}
                    className={`transition-all duration-1000 ${
                      fitScore.overallScore >= 80 ? 'text-emerald-500' :
                      fitScore.overallScore >= 60 ? 'text-blue-500' :
                      fitScore.overallScore >= 40 ? 'text-amber-500' :
                      'text-red-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{fitScore.overallScore}</div>
                    <div className="text-xs text-slate-400">Fit Score</div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Mission Alignment</span>
                    <span className="text-white">{fitScore.missionScore}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${fitScore.missionScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Capacity Match</span>
                    <span className="text-white">{fitScore.capacityScore}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${fitScore.capacityScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Geographic Fit</span>
                    <span className="text-white">{fitScore.geographicScore}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-1000"
                      style={{ width: `${fitScore.geographicScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Historical Success</span>
                    <span className="text-white">{fitScore.historyScore}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-1000"
                      style={{ width: `${fitScore.historyScore}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-400 text-sm">Estimated Effort:</span>
                  <span className="text-white ml-2 font-medium">{fitScore.estimatedHours} hours</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveToPipeline}
              disabled={saveOpportunityMutation.isPending}
              className="w-full mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveOpportunityMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save to Pipeline
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Opportunity Discovery Section */}
      {analysisStep === 'idle' && (
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          {showFilters && (
            <div className="w-80 flex-shrink-0 space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Funder Type */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">
                      Funder Type
                    </label>
                    <div className="space-y-2">
                      {FUNDER_TYPES.map((type) => (
                        <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFunderTypes.includes(type.value)}
                            onChange={() => toggleFunderType(type.value)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-300">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">
                      Amount Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min amount"
                        value={amountMin ?? ''}
                        onChange={(e) => setAmountMin(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max amount"
                        value={amountMax ?? ''}
                        onChange={(e) => setAmountMax(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">
                      Deadline
                    </label>
                    <select
                      value={deadlinePreset}
                      onChange={(e) => setDeadlinePreset(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All deadlines</option>
                      <option value="30">Next 30 days</option>
                      <option value="60">Next 60 days</option>
                      <option value="90">Next 90 days</option>
                    </select>
                  </div>

                  {/* Program Area */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">
                      Program Area
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {PROGRAM_AREAS.map((area) => (
                        <label key={area} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProgramAreas.includes(area)}
                            onChange={() => toggleProgramArea(area)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-300">{area}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Geographic Focus */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-3 block">
                      Geographic Focus
                    </label>
                    <div className="max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {US_STATES.map((state) => (
                          <label key={state} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStates.includes(state)}
                              onChange={() => toggleState(state)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <span className="text-xs text-slate-300">{state}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Minimum Fit Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">Minimum Fit Score</label>
                      <span className="text-sm font-medium text-white">{minFitScore}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minFitScore}
                      onChange={(e) => setMinFitScore(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Search and Controls Bar */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search grants, funders, or keywords..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-600 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid view"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                    showFilters
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 border border-slate-600 text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Controls */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="deadline">Deadline</option>
                  <option value="fitScore">Fit Score</option>
                  <option value="createdAt">Recently Added</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2.5 bg-slate-900 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <TrendingUp
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      sortOrder === 'desc' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Opportunity Cards */}
            {opportunities && opportunities.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                {opportunities.map((opp) => {
                  const daysRemaining = opp.deadline ? getDaysRemaining(opp.deadline) : null
                  const programAreas = Array.isArray(opp.funder?.programAreas) ? opp.funder.programAreas : []

                  return (
                    <div
                      key={opp.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all cursor-pointer group"
                      onClick={() => router.push(`/grants/${opp.id}`)}
                    >
                      {/* Header with Funder */}
                      <div className="flex items-start gap-3 mb-4">
                        {opp.funder ? (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {opp.funder.name.charAt(0)}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {opp.funder && (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm text-slate-400 truncate">{opp.funder.name}</p>
                              <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded flex-shrink-0">
                                {opp.funder.type.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                          <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                            {opp.title}
                          </h3>
                        </div>
                        {opp.fitScore && (
                          <div className="flex-shrink-0">
                            <FitScoreCard fitScore={opp.fitScore} variant="mini" />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                        {opp.description || 'No description available'}
                      </p>

                      {/* Program Areas */}
                      {programAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {programAreas.slice(0, 3).map((area, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3" />
                              {String(area)}
                            </span>
                          ))}
                          {programAreas.length > 3 && (
                            <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">
                              +{programAreas.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="space-y-2 border-t border-slate-700 pt-4">
                        {/* Amount */}
                        {(opp.amountMin || opp.amountMax) && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-400">Amount:</span>
                            <span className="text-white font-medium">
                              {opp.amountMin && `$${opp.amountMin.toLocaleString()}`}
                              {opp.amountMin && opp.amountMax && ' - '}
                              {opp.amountMax && `$${opp.amountMax.toLocaleString()}`}
                            </span>
                          </div>
                        )}

                        {/* Deadline */}
                        {opp.deadline && daysRemaining !== null && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className={`w-4 h-4 ${getDeadlineColor(daysRemaining)}`} />
                            <span className="text-slate-400">Deadline:</span>
                            <span className="text-white font-medium">
                              {new Date(opp.deadline).toLocaleDateString()}
                            </span>
                            <span className={`text-xs ${getDeadlineColor(daysRemaining)}`}>
                              ({daysRemaining > 0 ? `${daysRemaining} days` : 'Past due'})
                            </span>
                          </div>
                        )}

                        {/* Estimated Hours */}
                        {opp.fitScore?.estimatedHours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-400">Est. Effort:</span>
                            <span className="text-white font-medium">{opp.fitScore.estimatedHours}h</span>
                          </div>
                        )}

                        {/* Location */}
                        {opp.funder?.state && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-amber-500" />
                            <span className="text-slate-400">Location:</span>
                            <span className="text-white font-medium">{opp.funder.state}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/grants/${opp.id}`)
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Add to Pipeline
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/opportunities/${opp.id}`)
                          }}
                          className="px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No opportunities found</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-4">
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters to see more results.'
                    : 'Analyze your first RFP to discover opportunities tailored to your organization.'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
