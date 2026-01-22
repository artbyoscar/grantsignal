'use client'

import { useState, useEffect } from 'react'
import { Volume2, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'

interface VoiceConsistencyIndicatorProps {
  text: string
  className?: string
}

export function VoiceConsistencyIndicator({
  text,
  className,
}: VoiceConsistencyIndicatorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [consistencyData, setConsistencyData] = useState<{
    consistencyScore: number
    level: 'high' | 'medium' | 'low'
    suggestions: string[]
  } | null>(null)

  // TODO: Implement voice.analyzeConsistency endpoint
  useEffect(() => {
    // Debounce analysis - only analyze if text is substantial
    if (!text || text.trim().length < 50) {
      setConsistencyData(null)
      return
    }

    const timeoutId = setTimeout(() => {
      performAnalysis()
    }, 2000) // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId)
  }, [text])

  const performAnalysis = async () => {
    if (!text || text.trim().length < 50) return

    // TODO: Replace with actual API call when voice router is implemented
    setConsistencyData(null)
  }

  if (!text || text.trim().length < 50) {
    return null
  }

  const getIcon = () => {
    if (isAnalyzing) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }

    if (!consistencyData) {
      return <Volume2 className="w-4 h-4" />
    }

    if (consistencyData.level === 'high') {
      return <CheckCircle className="w-4 h-4" />
    }

    if (consistencyData.level === 'medium') {
      return <AlertTriangle className="w-4 h-4" />
    }

    return <AlertCircle className="w-4 h-4" />
  }

  const getColor = () => {
    if (isAnalyzing || !consistencyData) {
      return 'text-slate-400'
    }

    if (consistencyData.level === 'high') {
      return 'text-green-400'
    }

    if (consistencyData.level === 'medium') {
      return 'text-amber-400'
    }

    return 'text-red-400'
  }

  const getText = () => {
    if (isAnalyzing) {
      return 'Analyzing voice...'
    }

    if (!consistencyData) {
      return 'Voice consistency'
    }

    return `${consistencyData.consistencyScore}% consistent`
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
        getColor(),
        consistencyData?.level === 'high' && 'bg-green-500/10 border-green-500/30',
        consistencyData?.level === 'medium' && 'bg-amber-500/10 border-amber-500/30',
        consistencyData?.level === 'low' && 'bg-red-500/10 border-red-500/30',
        (!consistencyData || isAnalyzing) && 'bg-slate-800 border-slate-700',
        className
      )}
    >
      {getIcon()}
      <span className="text-xs font-medium">{getText()}</span>

      {consistencyData && consistencyData.suggestions.length > 0 && (
        <div className="group relative">
          <button className="ml-1 p-0.5 hover:bg-slate-700 rounded transition-colors">
            <AlertCircle className="w-3 h-3" />
          </button>

          {/* Tooltip with suggestions */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="text-xs text-white font-medium mb-2">Voice Suggestions:</div>
            <ul className="space-y-1">
              {consistencyData.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>

            {/* Metrics */}
            {consistencyData.level !== 'high' && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>
                    Avg sentence length: {(consistencyData as any).metrics?.avgSentenceLength} words
                    (target: {(consistencyData as any).metrics?.targetAvgLength})
                  </div>
                </div>
              </div>
            )}

            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
