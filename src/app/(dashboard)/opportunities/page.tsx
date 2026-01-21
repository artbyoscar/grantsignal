'use client'

import { useState } from 'react'
import { Search, Upload, Zap, Database, Brain, ExternalLink, Loader2, CheckCircle2, AlertCircle, Filter, SlidersHorizontal, Calendar, TrendingUp, Clock } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'
import { FitScoreCard } from '@/components/fit-score-card'

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

export default function OpportunitiesPage() {
  const router = useRouter()
  const [inputUrl, setInputUrl] = useState('')
  const [inputText, setInputText] = useState('')
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsedRfp, setParsedRfp] = useState<ParsedRFP | null>(null)
  const [fitScore, setFitScore] = useState<FitScore | null>(null)

  // Opportunity list state
  const [sortBy, setSortBy] = useState<'deadline' | 'fitScore' | 'createdAt'>('deadline')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [minFitScore, setMinFitScore] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const parseRfpMutation = api.discovery.parseRfp.useMutation()
  const calculateFitMutation = api.discovery.calculateFitScore.useMutation()
  const saveOpportunityMutation = api.discovery.saveOpportunity.useMutation()

  // Query for listing opportunities with fit scores
  const { data: opportunities, refetch: refetchOpportunities } = api.discovery.listOpportunities.useQuery(
    {
      sortBy,
      sortOrder,
      minFitScore,
      includeDeadlinePassed: false,
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

      // Step 2: Save opportunity temporarily to get an ID (we can enhance this later)
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

  const isAnalyzing = analysisStep === 'parsing' || analysisStep === 'scoring'
  const hasInput = Boolean(inputUrl || inputText)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Smart Discovery</h1>
        <p className="text-slate-400 mt-1">Find and analyze grant opportunities.</p>
      </div>

      {/* Main Input Area */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <h2 className="text-lg font-semibold text-white mb-4">Analyze Opportunity</h2>
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

        {/* Upload Area (placeholder for future implementation) */}
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-not-allowed opacity-50">
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">File upload coming soon</p>
          <p className="text-sm text-slate-500 mt-1">PDF, DOCX up to 25MB</p>
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
                analysisStep === 'parsing' ? 'bg-blue-900/30 border border-blue-800' :
                analysisStep === 'scoring' || analysisStep === 'complete' ? 'bg-slate-900' : 'bg-slate-900'
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
                analysisStep === 'complete' ? 'bg-slate-900' : 'bg-slate-900 opacity-50'
              }`}>
                {analysisStep === 'scoring' ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                ) : analysisStep === 'complete' ? (
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
                {fitScore.reusableContent.relevantDocuments.length > 0 && (
                  <div className="col-span-2 pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Relevant Documents:</span>
                      <span className="text-emerald-400 font-medium">{fitScore.reusableContent.relevantDocuments.length}</span>
                    </div>
                  </div>
                )}
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

          {/* Analysis Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            {fitScore.reusableContent.strengths.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {fitScore.reusableContent.strengths.map((strength, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {fitScore.reusableContent.concerns.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Considerations
                </h3>
                <ul className="space-y-2">
                  {fitScore.reusableContent.concerns.map((concern, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Requirements Checklist */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
            <div className="space-y-3">
              {parsedRfp.requirements.map((req, idx) => (
                <div key={idx} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">{req.section}</h4>
                    <span className="text-sm text-slate-400">{req.wordLimit} words</span>
                  </div>
                  <p className="text-sm text-slate-400">{req.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Eligibility Criteria</h3>
            <ul className="space-y-2">
              {parsedRfp.eligibility.map((criterion, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          {fitScore.reusableContent.recommendations.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
              <ul className="space-y-2">
                {fitScore.reusableContent.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                    <Brain className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Relevant Documents */}
          {fitScore.reusableContent.relevantDocuments.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Relevant Documents</h3>
              <div className="space-y-3">
                {fitScore.reusableContent.relevantDocuments.map((doc, idx) => (
                  <div key={idx} className="border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Database className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{doc.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{doc.relevance}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                          {doc.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opportunity List - Only show when not analyzing or showing results */}
      {analysisStep === 'idle' && (
        <>
          {/* Intelligence Status */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Active Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <Database className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">Grants.gov API</p>
                  <p className="text-xs text-slate-500">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <ExternalLink className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">ProPublica 990</p>
                  <p className="text-xs text-slate-500">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <Brain className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">Organizational Memory</p>
                  <p className="text-xs text-slate-500">No documents yet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunities Section */}
          <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                Analyzed Opportunities
                {opportunities && opportunities.length > 0 && (
                  <span className="ml-2 text-slate-400 text-base">({opportunities.length})</span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="deadline">Deadline</option>
                    <option value="fitScore">Fit Score</option>
                    <option value="createdAt">Recently Added</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                    title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                  >
                    <TrendingUp
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        sortOrder === 'desc' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showFilters || minFitScore > 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 border border-slate-600 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                  {minFitScore > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">
                      1
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Filter Options</h3>
                <div className="space-y-4">
                  {/* Minimum Fit Score Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-400">Minimum Fit Score</label>
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
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Reset Filters */}
                  {minFitScore > 0 && (
                    <button
                      onClick={() => setMinFitScore(0)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Opportunity Cards */}
            {opportunities && opportunities.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer"
                    onClick={() => router.push(`/opportunities/${opp.id}`)}
                  >
                    {/* Header with Fit Score */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{opp.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {opp.description || 'No description available'}
                        </p>
                      </div>
                      {opp.fitScore && (
                        <div className="flex-shrink-0">
                          <FitScoreCard fitScore={opp.fitScore} variant="mini" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm border-t border-slate-700 pt-4">
                      {opp.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-400">Deadline:</span>
                          <span className="text-white font-medium">
                            {new Date(opp.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {(opp.amountMin || opp.amountMax) && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Amount:</span>
                          <span className="text-white font-medium">
                            {opp.amountMin && `$${opp.amountMin.toLocaleString()}`}
                            {opp.amountMin && opp.amountMax && ' - '}
                            {opp.amountMax && `$${opp.amountMax.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      {opp.fitScore?.estimatedHours && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-400">Est. Effort:</span>
                          <span className="text-white font-medium">{opp.fitScore.estimatedHours}h</span>
                        </div>
                      )}
                    </div>

                    {/* Relevant Documents Badge */}
                    {opp.fitScore?.reusableContent &&
                     typeof opp.fitScore.reusableContent === 'object' &&
                     'relevantDocuments' in opp.fitScore.reusableContent &&
                     opp.fitScore.reusableContent.relevantDocuments &&
                     Array.isArray(opp.fitScore.reusableContent.relevantDocuments) &&
                     opp.fitScore.reusableContent.relevantDocuments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Database className="w-4 h-4 text-emerald-500" />
                          <span>{opp.fitScore.reusableContent.relevantDocuments.length} relevant document{opp.fitScore.reusableContent.relevantDocuments.length !== 1 ? 's' : ''} found</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No opportunities analyzed yet</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Paste a grant URL or upload an RFP above to see fit scores, reusable content analysis, and funder intelligence.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
