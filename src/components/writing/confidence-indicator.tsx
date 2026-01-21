'use client'

import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

export interface ConfidenceIndicatorProps {
  confidence: 'high' | 'medium' | 'low'
  score: number
  className?: string
}

export function ConfidenceIndicator({
  confidence,
  score,
  className = '',
}: ConfidenceIndicatorProps) {
  const config = {
    high: {
      icon: CheckCircle,
      text: 'High Confidence',
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-800',
      description: 'Strong organizational context found',
    },
    medium: {
      icon: AlertTriangle,
      text: 'Medium Confidence',
      color: 'text-amber-400',
      bg: 'bg-amber-900/20',
      border: 'border-amber-800',
      description: 'Some context found, review carefully',
    },
    low: {
      icon: AlertCircle,
      text: 'Low Confidence',
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800',
      description: 'Limited context available',
    },
  }

  const { icon: Icon, text, color, bg, border, description } =
    config[confidence]

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bg} ${border} ${className}`}
    >
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${color}`}>{text}</p>
        <p className="text-xs text-slate-400">
          {description} ({score}%)
        </p>
      </div>
    </div>
  )
}
