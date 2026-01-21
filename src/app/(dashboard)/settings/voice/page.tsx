'use client'

import { useState } from 'react'
import { RefreshCw, TrendingUp, CheckCircle, XCircle, Plus, Trash2, ChevronDown, ChevronUp, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type VoiceAxis = {
  name: string
  leftLabel: string
  rightLabel: string
  value: number
}

type PatternType = 'opening' | 'transition' | 'evidence' | 'closing'

type Pattern = {
  type: PatternType
  description: string
  example: string
  enabled: boolean
}

export default function VoiceAnalysisPage() {
  const [isRecalibrating, setIsRecalibrating] = useState(false)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)
  const [showAddPreferred, setShowAddPreferred] = useState(false)
  const [showAddAvoided, setShowAddAvoided] = useState(false)
  const [newPreferred, setNewPreferred] = useState({ from: '', to: '' })
  const [newAvoided, setNewAvoided] = useState({ term: '' })
  const [isLoadingComparison, setIsLoadingComparison] = useState(false)
  const [comparison, setComparison] = useState<{
    original: string
    rewritten: string
    changes: string[]
  } | null>(null)

  // Fetch voice profile
  const { data: profileData, isLoading, refetch } = api.organizations.getVoiceProfile.useQuery()
  const updateVoiceProfileMutation = api.organizations.updateVoiceProfile.useMutation()
  const analyzeVoiceMutation = api.organizations.analyzeVoice.useMutation()
  const getVoiceComparisonMutation = api.organizations.getVoiceComparison.useMutation()

  // Extract voice profile data
  const profile = profileData?.profile
  const metadata = profileData?.metadata
  const availableDocuments = profileData?.availableDocuments || 0

  // Convert tone values to radar chart axes
  const axes: VoiceAxis[] = profile
    ? [
        {
          name: 'Formality',
          leftLabel: 'Formal',
          rightLabel: 'Casual',
          value: profile.tone.formality,
        },
        {
          name: 'Communication',
          leftLabel: 'Direct',
          rightLabel: 'Indirect',
          value: profile.tone.directness,
        },
        {
          name: 'Approach',
          leftLabel: 'Data-Driven',
          rightLabel: 'Narrative',
          value: profile.tone.dataEmphasis,
        },
        {
          name: 'Tone',
          leftLabel: 'Optimistic',
          rightLabel: 'Realistic',
          value: profile.tone.optimism,
        },
        {
          name: 'Urgency',
          leftLabel: 'Urgent',
          rightLabel: 'Steady',
          value: profile.tone.urgency,
        },
        {
          name: 'Complexity',
          leftLabel: 'Complex',
          rightLabel: 'Simple',
          value: profile.tone.complexity,
        },
      ]
    : []

  const patterns = profile?.patterns || []
  const preferredTerms = profile?.vocabulary.preferredTerms || {}
  const avoidedTerms = profile?.vocabulary.avoidedTerms || []

  // Sample text for comparison
  const sampleText = `Our organization is seeking funding to address the issue of homelessness in our community. We have identified that there are approximately 500 homeless individuals who need assistance. Through our comprehensive program, we will provide housing and support services to help them transition back into society.`

  // Handle recalibration
  const handleRecalibrate = async () => {
    setIsRecalibrating(true)
    try {
      await analyzeVoiceMutation.mutateAsync({ forceRefresh: true })
      toast.success('Voice recalibration started. This may take a few minutes.')
      refetch()
    } catch (error) {
      toast.error('Failed to start recalibration')
    } finally {
      setIsRecalibrating(false)
    }
  }

  // Load voice comparison
  const loadComparison = async () => {
    if (!profile) {
      toast.error('No voice profile available. Run voice analysis first.')
      return
    }

    setIsLoadingComparison(true)
    try {
      const result = await getVoiceComparisonMutation.mutateAsync({
        sampleText,
      })
      setComparison(result)
    } catch (error) {
      toast.error('Failed to load voice comparison')
    } finally {
      setIsLoadingComparison(false)
    }
  }

  // Toggle pattern
  const togglePattern = async (type: PatternType) => {
    if (!profile) return

    const updatedPatterns = profile.patterns.map(p =>
      p.type === type ? { ...p, enabled: !p.enabled } : p
    )

    try {
      await updateVoiceProfileMutation.mutateAsync({
        patterns: updatedPatterns.map(p => ({ type: p.type, enabled: p.enabled })),
      })
      toast.success('Pattern updated')
      refetch()
    } catch (error) {
      toast.error('Failed to update pattern')
    }
  }

  // Add preferred term
  const handleAddPreferred = async () => {
    if (!newPreferred.from || !newPreferred.to) {
      toast.error('Please fill in both fields')
      return
    }

    try {
      await updateVoiceProfileMutation.mutateAsync({
        preferredTerms: {
          [newPreferred.from]: newPreferred.to,
        },
      })
      toast.success('Preferred term added')
      setShowAddPreferred(false)
      setNewPreferred({ from: '', to: '' })
      refetch()
    } catch (error) {
      toast.error('Failed to add preferred term')
    }
  }

  // Add avoided term
  const handleAddAvoided = async () => {
    if (!newAvoided.term) {
      toast.error('Please enter a term')
      return
    }

    try {
      await updateVoiceProfileMutation.mutateAsync({
        avoidedTerms: [newAvoided.term],
      })
      toast.success('Avoided term added')
      setShowAddAvoided(false)
      setNewAvoided({ term: '' })
      refetch()
    } catch (error) {
      toast.error('Failed to add avoided term')
    }
  }

  // Delete preferred term
  const handleDeletePreferredTerm = async (from: string) => {
    if (!profile) return

    const updatedPreferredTerms = { ...preferredTerms }
    delete updatedPreferredTerms[from]

    try {
      await updateVoiceProfileMutation.mutateAsync({
        preferredTerms: updatedPreferredTerms,
      })
      toast.success('Preferred term deleted')
      refetch()
    } catch (error) {
      toast.error('Failed to delete preferred term')
    }
  }

  // Delete avoided term
  const handleDeleteAvoidedTerm = async (term: string) => {
    if (!profile) return

    const updatedAvoidedTerms = avoidedTerms.filter(t => t !== term)

    try {
      await updateVoiceProfileMutation.mutateAsync({
        avoidedTerms: updatedAvoidedTerms,
      })
      toast.success('Avoided term deleted')
      refetch()
    } catch (error) {
      toast.error('Failed to delete avoided term')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-64 mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-96"></div>
        </div>
      </div>
    )
  }

  // No profile exists yet
  if (!profile || !metadata) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Voice Analysis</h1>
          <p className="text-slate-400 mt-1">
            Configure how GrantSignal matches your organization's writing style
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Voice Profile Yet</h3>
            <p className="text-slate-400 mb-6">
              Upload at least 5 documents to analyze your organization's writing style.
              You currently have {availableDocuments} document{availableDocuments !== 1 ? 's' : ''}.
            </p>
            {availableDocuments >= 5 && (
              <button
                onClick={handleRecalibrate}
                disabled={isRecalibrating}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRecalibrating ? 'animate-spin' : ''}`} />
                {isRecalibrating ? 'Analyzing...' : 'Analyze Voice'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Voice Analysis</h1>
          <p className="text-slate-400 mt-1">
            Configure how GrantSignal matches your organization's writing style
          </p>
        </div>
        <button
          onClick={handleRecalibrate}
          disabled={isRecalibrating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalibrating ? 'animate-spin' : ''}`} />
          {isRecalibrating ? 'Recalibrating...' : 'Recalibrate Voice'}
        </button>
      </div>

      {/* Voice Fingerprint Visualization */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Voice Fingerprint</h2>
        <VoiceRadarChart axes={axes} />
        <p className="text-sm text-slate-400 mt-4 text-center">
          Based on analysis of {metadata.documentsAnalyzed} uploaded document
          {metadata.documentsAnalyzed !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Side-by-Side Comparison Demo */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Voice in Action</h2>
          {!comparison && (
            <button
              onClick={loadComparison}
              disabled={isLoadingComparison}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoadingComparison ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load Comparison'
              )}
            </button>
          )}
        </div>

        {!comparison ? (
          <div className="text-center py-8 text-slate-400">
            Click "Load Comparison" to see how we can rewrite sample text in your organization's voice
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              {/* Original Draft */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Original Draft</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{comparison.original}</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="p-2 bg-blue-600 rounded-full shadow-lg">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Rewritten in Your Voice */}
              <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-400 mb-3">Rewritten in Your Voice</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{comparison.rewritten}</p>
              </div>
            </div>

            {/* Changes Made */}
            {comparison.changes.length > 0 && (
              <div className="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Key Changes</h3>
                <ul className="space-y-1">
                  {comparison.changes.map((change, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detected Patterns */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Detected Patterns</h2>
        <div className="space-y-3">
          {patterns.map((pattern) => (
            <div
              key={pattern.type}
              className="bg-slate-900 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-medium text-white capitalize">{pattern.type}</h3>
                    <button
                      onClick={() => togglePattern(pattern.type)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        pattern.enabled ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          pattern.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{pattern.description}</p>
                  <div className="bg-slate-800 border border-slate-700 rounded p-2">
                    <p className="text-xs text-slate-400 mb-1">Example:</p>
                    <p className="text-xs text-slate-300 italic">"{pattern.example}"</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Profile Stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Voice Profile Stats</h2>
          <button
            onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showFullAnalysis ? (
              <>
                Hide Full Analysis
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View Full Analysis
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-semibold text-white mb-1">
              {metadata.documentsAnalyzed}
            </div>
            <div className="text-sm text-slate-400">Documents Analyzed</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-semibold text-white mb-1">
              {formatDistanceToNow(new Date(metadata.lastUpdated), { addSuffix: true })}
            </div>
            <div className="text-sm text-slate-400">Last Updated</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-semibold capitalize ${
                  metadata.confidence === 'high'
                    ? 'text-green-400'
                    : metadata.confidence === 'medium'
                    ? 'text-yellow-400'
                    : 'text-orange-400'
                }`}
              >
                {metadata.confidence}
              </div>
              {metadata.confidence === 'high' && (
                <TrendingUp className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div className="text-sm text-slate-400">Confidence Level</div>
          </div>
        </div>

        {showFullAnalysis && (
          <div className="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Detailed Analysis</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p>• Average sentence length: {profile.sentencePatterns.avgLength} words</p>
              <p>• Short sentences: {profile.sentencePatterns.shortRatio}% under 15 words</p>
              <p>• Complex sentences: {profile.sentencePatterns.complexRatio}% with clauses</p>
              <p>• Jargon level: {profile.vocabulary.jargonLevel}/100</p>
              <p>• Preferred terms: {Object.keys(preferredTerms).length} configured</p>
              <p>• Avoided terms: {avoidedTerms.length} configured</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Overrides */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Manual Overrides</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddPreferred(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Preferred Term
            </button>
            <button
              onClick={() => setShowAddAvoided(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Avoided Term
            </button>
          </div>
        </div>

        {Object.keys(preferredTerms).length === 0 && avoidedTerms.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No manual overrides configured. Add preferred or avoided terms to customize your voice
            profile.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preferred Terms */}
            {Object.keys(preferredTerms).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Preferred Terms</h3>
                <div className="space-y-2">
                  {Object.entries(preferredTerms).map(([from, to]) => (
                    <div
                      key={from}
                      className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-slate-300">
                          Use "{to}" instead of "{from}"
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeletePreferredTerm(from)}
                        className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avoided Terms */}
            {avoidedTerms.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Avoided Terms</h3>
                <div className="space-y-2">
                  {avoidedTerms.map((term) => (
                    <div
                      key={term}
                      className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-slate-300">Avoid "{term}"</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAvoidedTerm(term)}
                        className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Preferred Term Modal */}
      {showAddPreferred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddPreferred(false)}
          />
          <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Preferred Term</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instead of
                </label>
                <input
                  type="text"
                  value={newPreferred.from}
                  onChange={(e) => setNewPreferred({ ...newPreferred, from: e.target.value })}
                  placeholder="e.g., homeless"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Use</label>
                <input
                  type="text"
                  value={newPreferred.to}
                  onChange={(e) => setNewPreferred({ ...newPreferred, to: e.target.value })}
                  placeholder="e.g., unhoused neighbors"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddPreferred(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPreferred}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add Term
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Avoided Term Modal */}
      {showAddAvoided && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddAvoided(false)}
          />
          <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Avoided Term</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Term to Avoid
                </label>
                <input
                  type="text"
                  value={newAvoided.term}
                  onChange={(e) => setNewAvoided({ term: e.target.value })}
                  placeholder="e.g., utilize"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddAvoided(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAvoided}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Radar Chart Component
function VoiceRadarChart({ axes }: { axes: VoiceAxis[] }) {
  if (axes.length === 0) return null

  const size = 400
  const center = size / 2
  const radius = size / 2 - 60
  const angleStep = (Math.PI * 2) / axes.length

  // Calculate points for the data polygon
  const dataPoints = axes
    .map((axis, i) => {
      const angle = angleStep * i - Math.PI / 2
      const value = axis.value / 100
      const x = center + Math.cos(angle) * radius * value
      const y = center + Math.sin(angle) * radius * value
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circles */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="rgb(51, 65, 85)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines and labels */}
        {axes.map((axis, i) => {
          const angle = angleStep * i - Math.PI / 2
          const x = center + Math.cos(angle) * radius
          const y = center + Math.sin(angle) * radius
          const labelX = center + Math.cos(angle) * (radius + 40)
          const labelY = center + Math.sin(angle) * (radius + 40)

          return (
            <g key={i}>
              {/* Axis line */}
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgb(51, 65, 85)"
                strokeWidth="1"
              />

              {/* Axis label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-slate-300 font-medium"
              >
                {axis.name}
              </text>

              {/* Left label */}
              <text
                x={center + Math.cos(angle) * 30}
                y={center + Math.sin(angle) * 30}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-slate-500"
              >
                {axis.leftLabel}
              </text>

              {/* Right label */}
              <text
                x={center + Math.cos(angle) * (radius - 20)}
                y={center + Math.sin(angle) * (radius - 20)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-slate-500"
              >
                {axis.rightLabel}
              </text>
            </g>
          )
        })}

        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgb(59, 130, 246)"
          fillOpacity="0.3"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
        />

        {/* Data points */}
        {axes.map((axis, i) => {
          const angle = angleStep * i - Math.PI / 2
          const value = axis.value / 100
          const x = center + Math.cos(angle) * radius * value
          const y = center + Math.sin(angle) * radius * value

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="rgb(59, 130, 246)"
              stroke="white"
              strokeWidth="2"
            />
          )
        })}
      </svg>
    </div>
  )
}
