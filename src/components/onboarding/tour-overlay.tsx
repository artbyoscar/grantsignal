'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, BarChart3, PenTool, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  position: {
    top?: string
    left?: string
    right?: string
    bottom?: string
  }
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'pipeline',
    title: 'Pipeline',
    description: 'Track all your grant opportunities from prospect to closeout',
    icon: BarChart3,
    position: { top: '20%', left: '5%' },
  },
  {
    id: 'discovery',
    title: 'Smart Discovery',
    description: 'AI-powered matching finds funders aligned with your mission',
    icon: Sparkles,
    position: { top: '35%', left: '5%' },
  },
  {
    id: 'writing',
    title: 'Writing Studio',
    description: 'Generate compelling proposals using your organization\'s voice',
    icon: PenTool,
    position: { top: '50%', left: '5%' },
  },
  {
    id: 'compliance',
    title: 'Compliance Guardian',
    description: 'Automatically track commitments and avoid conflicts',
    icon: ShieldCheck,
    position: { top: '65%', left: '5%' },
  },
]

export function TourOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem('onboarding-tour-completed')
    if (!tourCompleted) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding-tour-completed', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

      {/* Tour Card */}
      <div
        className="fixed z-50 w-80"
        style={{
          top: step.position.top,
          left: step.position.left,
          right: step.position.right,
          bottom: step.position.bottom,
        }}
      >
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-slate-400">
                  {currentStep + 1} of {TOUR_STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-slate-300">{step.description}</p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 text-slate-400"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {currentStep < TOUR_STEPS.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
