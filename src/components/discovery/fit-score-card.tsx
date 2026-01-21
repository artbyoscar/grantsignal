'use client'

import { useState } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/trpc/client'

interface FitScoreData {
  overallScore: number
  missionScore: number
  capacityScore: number
  geographicScore?: number
  historicalScore: number
  reusableContentPercentage: number
  estimatedHours: number
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  reusableContentDetails?: {
    sectionName: string
    hasContent: boolean
    suggestedSources: Array<{
      documentId: string
      documentName: string
      relevance: number
    }>
  }[]
}

interface FitScoreCardProps {
  opportunityId: string
  variant?: 'full' | 'compact' | 'mini'
  initialData?: FitScoreData
  onRecalculate?: () => void
}

export function FitScoreCard({
  opportunityId,
  variant = 'full',
  initialData,
  onRecalculate
}: FitScoreCardProps) {
  const [scoreData, setScoreData] = useState<FitScoreData | null>(initialData || null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(!initialData)

  // TODO: Replace with actual query when getFitScore endpoint is created
  // const { data, isLoading, refetch } = api.discovery.getFitScore.useQuery({ opportunityId })

  const recalculateMutation = api.discovery.calculateFitScore.useMutation({
    onSuccess: (data) => {
      setScoreData(data as unknown as FitScoreData)
      onRecalculate?.()
    },
  })

  const handleRecalculate = () => {
    setIsLoading(true)
    // TODO: Call with actual opportunity data
    // recalculateMutation.mutate({ opportunityId })
    // Simulating for now
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  if (isLoading) {
    return <LoadingSkeleton variant={variant} />
  }

  if (!scoreData) {
    return null
  }

  if (variant === 'mini') {
    return <MiniVariant score={scoreData.overallScore} breakdown={scoreData} />
  }

  if (variant === 'compact') {
    return (
      <CompactVariant
        score={scoreData.overallScore}
        estimatedHours={scoreData.estimatedHours}
        reusableContentPercentage={scoreData.reusableContentPercentage}
        opportunityId={opportunityId}
      />
    )
  }

  return (
    <FullVariant
      scoreData={scoreData}
      isExpanded={isExpanded}
      onToggleExpanded={() => setIsExpanded(!isExpanded)}
      onRecalculate={handleRecalculate}
      isRecalculating={recalculateMutation.isPending}
    />
  )
}

// Mini Variant - For grid cards
function MiniVariant({ score, breakdown }: { score: number; breakdown: FitScoreData }) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500'
    if (score >= 70) return 'text-blue-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreStatus = (score: number) => {
    if (score >= 85) return 'Excellent Match'
    if (score >= 70) return 'Good Match'
    if (score >= 50) return 'Moderate Match'
    return 'Weak Match'
  }

  const circumference = 2 * Math.PI * 28
  const offset = circumference - (score / 100) * circumference

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-16 h-16 cursor-help">
            <svg className="w-16 h-16 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={cn('transition-all duration-1000', getScoreColor(score))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-lg font-bold', getScoreColor(score))}>
                {score}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-64 p-4 bg-slate-800 border-slate-700">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Fit Score Breakdown</p>
              <p className={cn('text-xs', getScoreColor(score))}>{getScoreStatus(score)}</p>
            </div>
            <div className="space-y-2 text-xs">
              <ScoreRow label="Mission Alignment" score={breakdown.missionScore} />
              <ScoreRow label="Capacity Match" score={breakdown.capacityScore} />
              {breakdown.geographicScore && (
                <ScoreRow label="Geographic Fit" score={breakdown.geographicScore} />
              )}
              <ScoreRow label="Funder History" score={breakdown.historicalScore} />
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-400">Reusable Content</span>
                <span className="text-white">{breakdown.reusableContentPercentage}%</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compact Variant - For list rows
function CompactVariant({
  score,
  estimatedHours,
  reusableContentPercentage,
  opportunityId
}: {
  score: number
  estimatedHours: number
  reusableContentPercentage: number
  opportunityId: string
}) {
  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 85) return 'default'
    if (score >= 70) return 'secondary'
    if (score >= 50) return 'outline'
    return 'destructive'
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500'
    if (score >= 70) return 'text-blue-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <Badge
        variant={getScoreBadgeVariant(score)}
        className={cn('font-semibold', getScoreColor(score))}
      >
        {score} Fit
      </Badge>
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>{estimatedHours}h</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <FileText className="w-3.5 h-3.5" />
        <span>{reusableContentPercentage}% reusable</span>
      </div>
      <button
        className="ml-auto text-xs text-blue-400 hover:text-blue-300 transition-colors"
        onClick={() => {
          // TODO: Navigate to full view or open modal
          console.log('View details for:', opportunityId)
        }}
      >
        View Details →
      </button>
    </div>
  )
}

// Full Variant - For detail page
function FullVariant({
  scoreData,
  isExpanded,
  onToggleExpanded,
  onRecalculate,
  isRecalculating
}: {
  scoreData: FitScoreData
  isExpanded: boolean
  onToggleExpanded: () => void
  onRecalculate: () => void
  isRecalculating: boolean
}) {
  const {
    overallScore,
    missionScore,
    capacityScore,
    geographicScore,
    historicalScore,
    reusableContentPercentage,
    estimatedHours,
    recommendations,
    reusableContentDetails
  } = scoreData

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500'
    if (score >= 70) return 'text-blue-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Moderate'
    return 'Weak'
  }

  const getStatusIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="w-4 h-4 text-emerald-400" />
    if (score >= 50) return <AlertTriangle className="w-4 h-4 text-amber-400" />
    return <AlertCircle className="w-4 h-4 text-red-400" />
  }

  const circumference = 2 * Math.PI * 56
  const offset = circumference - (overallScore / 100) * circumference

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-white">Opportunity Fit Score</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onRecalculate}
          disabled={isRecalculating}
          className="gap-2"
        >
          {isRecalculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh Score
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={cn('transition-all duration-1000', getScoreColor(overallScore))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={cn('text-4xl font-bold', getScoreColor(overallScore))}>
                  {overallScore}
                </div>
                <div className="text-sm text-slate-400 mt-1">Overall Fit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Score Breakdown</h3>
          <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Component</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Score</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                <ScoreBreakdownRow
                  label="Mission Alignment"
                  score={missionScore}
                  getScoreColor={getScoreColor}
                  getScoreLabel={getScoreLabel}
                  getStatusIcon={getStatusIcon}
                />
                <ScoreBreakdownRow
                  label="Capacity Match"
                  score={capacityScore}
                  getScoreColor={getScoreColor}
                  getScoreLabel={getScoreLabel}
                  getStatusIcon={getStatusIcon}
                />
                {geographicScore && (
                  <ScoreBreakdownRow
                    label="Geographic Fit"
                    score={geographicScore}
                    getScoreColor={getScoreColor}
                    getScoreLabel={getScoreLabel}
                    getStatusIcon={getStatusIcon}
                  />
                )}
                <ScoreBreakdownRow
                  label="Funder History"
                  score={historicalScore}
                  getScoreColor={getScoreColor}
                  getScoreLabel={getScoreLabel}
                  getStatusIcon={getStatusIcon}
                  description={historicalScore < 50 ? 'No prior contact' : undefined}
                />
                <tr className="border-t border-slate-700">
                  <td className="py-3 px-4 text-sm text-slate-300">Reusable Content</td>
                  <td className="text-right py-3 px-4">
                    <span className={cn('text-sm font-medium', getScoreColor(reusableContentPercentage))}>
                      {reusableContentPercentage}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {getStatusIcon(reusableContentPercentage)}
                      <span className="text-sm text-slate-400">
                        {getScoreLabel(reusableContentPercentage)}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reusable Content Details */}
        {reusableContentDetails && reusableContentDetails.length > 0 && (
          <div>
            <button
              onClick={onToggleExpanded}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Reusable Content Details
              </h3>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {reusableContentDetails.map((section, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/50 rounded-lg border border-slate-700 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">{section.sectionName}</h4>
                      {section.hasContent ? (
                        <Badge variant="default" className="bg-emerald-900/30 text-emerald-400 border-emerald-800">
                          ✅ Content Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-900/30 text-red-400 border-red-800">
                          ❌ New Content Needed
                        </Badge>
                      )}
                    </div>
                    {section.hasContent && section.suggestedSources.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-400 mb-2">Suggested sources:</p>
                        <div className="space-y-1">
                          {section.suggestedSources.map((source) => (
                            <button
                              key={source.documentId}
                              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={() => {
                                // TODO: Navigate to document
                                console.log('Open document:', source.documentId)
                              }}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{source.documentName}</span>
                              <span className="text-slate-500">({Math.round(source.relevance * 100)}% match)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Estimate */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Estimated completion: {estimatedHours} hours
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Based on {reusableContentPercentage}% reusable content from your document library
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Recommendations</h3>
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    <p className="text-sm text-slate-300">{rec}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper Components
function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-white">{score}</span>
    </div>
  )
}

function ScoreBreakdownRow({
  label,
  score,
  description,
  getScoreColor,
  getScoreLabel,
  getStatusIcon
}: {
  label: string
  score: number
  description?: string
  getScoreColor: (score: number) => string
  getScoreLabel: (score: number) => string
  getStatusIcon: (score: number) => React.ReactNode
}) {
  return (
    <tr className="border-b border-slate-700/50 last:border-0">
      <td className="py-3 px-4 text-sm text-slate-300">
        {label}
        {description && (
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        )}
      </td>
      <td className="text-right py-3 px-4">
        <span className={cn('text-sm font-medium', getScoreColor(score))}>
          {score}
        </span>
      </td>
      <td className="text-right py-3 px-4">
        <div className="flex items-center justify-end gap-2">
          {getStatusIcon(score)}
          <span className="text-sm text-slate-400">{getScoreLabel(score)}</span>
        </div>
      </td>
    </tr>
  )
}

// Loading Skeleton
function LoadingSkeleton({ variant }: { variant: 'full' | 'compact' | 'mini' }) {
  if (variant === 'mini') {
    return (
      <div className="relative w-16 h-16 animate-pulse">
        <div className="w-16 h-16 bg-slate-700 rounded-full" />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 py-2 animate-pulse">
        <div className="h-6 w-16 bg-slate-700 rounded" />
        <div className="h-4 w-12 bg-slate-700 rounded" />
        <div className="h-4 w-24 bg-slate-700 rounded" />
      </div>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700 animate-pulse">
      <CardHeader>
        <div className="h-6 w-48 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-40 h-40 bg-slate-700 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-5/6" />
        </div>
        <div className="text-center text-sm text-slate-400">
          Calculating fit score...
        </div>
      </CardContent>
    </Card>
  )
}
