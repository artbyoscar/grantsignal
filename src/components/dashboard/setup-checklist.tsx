'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/trpc/client'

interface SetupStep {
  id: string
  title: string
  description: string
  href: string
  completed: boolean
}

interface SetupProgressData {
  steps: SetupStep[]
  completedCount: number
  totalCount: number
  percentComplete: number
  allDone: boolean
}

export function SetupChecklist({
  initialData,
}: {
  initialData: SetupProgressData
}) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Re-fetch to stay current as user completes steps
  const { data } = api.dashboard.getSetupProgress.useQuery(undefined, {
    initialData,
    refetchInterval: 30_000, // refresh every 30s
  })

  const progress = data ?? initialData

  // Hide if all done or user dismissed
  if (progress.allDone || dismissed) {
    return null
  }

  // Find next incomplete step
  const nextStep = progress.steps.find(s => !s.completed)

  return (
    <div className="bg-gradient-to-br from-blue-500/10 via-slate-800 to-slate-800 border border-blue-500/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Get Started with GrantSignal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {progress.completedCount} of {progress.totalCount} steps complete
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          )}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="Dismiss checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Expandable step list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-1">
          {progress.steps.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                if (!step.completed) {
                  router.push(step.href)
                }
              }}
              disabled={step.completed}
              className={`w-full flex items-start gap-3 p-2.5 rounded-md text-left transition-colors ${
                step.completed
                  ? 'opacity-60 cursor-default'
                  : 'hover:bg-slate-700/50 cursor-pointer'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    step.completed ? 'text-slate-400 line-through' : 'text-white'
                  }`}
                >
                  {step.title}
                </div>
                {!step.completed && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {step.description}
                  </div>
                )}
              </div>
              {!step.completed && (
                <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Quick action for next step (collapsed state) */}
      {!expanded && nextStep && (
        <div className="px-4 pb-4">
          <button
            onClick={() => router.push(nextStep.href)}
            className="w-full flex items-center gap-2 p-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors text-left"
          >
            <Circle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-sm text-blue-300 flex-1">
              Next: {nextStep.title}
            </span>
            <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
          </button>
        </div>
      )}
    </div>
  )
}
