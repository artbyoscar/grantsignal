import { CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react'

interface FitScoreData {
  overallScore: number
  missionScore: number
  capacityScore: number
  geographicScore: number
  historyScore: number
  estimatedHours: number | null
  reusableContent?: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    relevantDocuments: Array<{
      id: string
      name: string
      type: string
      relevance: string
    }>
  } | null
}

interface FitScoreCardProps {
  fitScore: FitScoreData
  variant?: 'mini' | 'full'
  showRecommendations?: boolean
  recommendations?: string[]
  strengths?: string[]
  concerns?: string[]
}

export function FitScoreCard({
  fitScore,
  variant = 'full',
  showRecommendations = false,
  recommendations = [],
  strengths = [],
  concerns = [],
}: FitScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Mini variant for opportunity cards
  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-slate-700"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - fitScore.overallScore / 100)}`}
              className={`transition-all duration-500 ${getScoreColor(fitScore.overallScore)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${getScoreColor(fitScore.overallScore)}`}>
              {fitScore.overallScore}
            </span>
          </div>
        </div>
        <div className="flex flex-col text-xs">
          <span className="text-slate-400">Fit Score</span>
          {fitScore.estimatedHours && (
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {fitScore.estimatedHours}h
            </span>
          )}
        </div>
      </div>
    )
  }

  // Full variant for detail view
  return (
    <div className="space-y-6">
      {/* Overall Score Circle */}
      <div className="flex items-center gap-6">
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
              className={`transition-all duration-1000 ${getScoreColor(fitScore.overallScore)}`}
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

        {/* Quick Stats */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-400">Mission</span>
            </div>
            <span className="text-lg font-bold text-white">{fitScore.missionScore}%</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-400">Capacity</span>
            </div>
            <span className="text-lg font-bold text-white">{fitScore.capacityScore}%</span>
          </div>
          {fitScore.estimatedHours && (
            <div className="bg-slate-900 rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-slate-400">Estimated Effort</span>
              </div>
              <span className="text-lg font-bold text-white">{fitScore.estimatedHours} hours</span>
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Score Breakdown</h4>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Mission Alignment</span>
            <span className="text-white">{fitScore.missionScore}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreBgColor(fitScore.missionScore)} transition-all duration-1000`}
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
              className={`h-full ${getScoreBgColor(fitScore.capacityScore)} transition-all duration-1000`}
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
              className={`h-full ${getScoreBgColor(fitScore.geographicScore)} transition-all duration-1000`}
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
              className={`h-full ${getScoreBgColor(fitScore.historyScore)} transition-all duration-1000`}
              style={{ width: `${fitScore.historyScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Relevant Documents */}
      {fitScore.reusableContent && fitScore.reusableContent.relevantDocuments.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">Relevant Documents</span>
            <span className="text-sm font-bold text-emerald-400">
              {fitScore.reusableContent.relevantDocuments.length}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Documents available to support this application
          </p>
        </div>
      )}

      {/* Recommendations, Strengths, and Concerns */}
      {showRecommendations && (
        <div className="space-y-4 pt-4 border-t border-slate-700">
          {strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Considerations
              </h4>
              <ul className="space-y-1">
                {concerns.map((concern, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
