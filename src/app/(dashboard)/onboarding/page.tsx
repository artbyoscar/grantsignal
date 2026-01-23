'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function OnboardingWelcomePage() {
  const { user } = useUser()
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/onboarding/organization')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 1 of 6</span>
            <span className="text-slate-400">Takes about 5 minutes</span>
          </div>
          <Progress value={17} />
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">
              Welcome to GrantSignal, {user?.firstName || 'there'}!
            </h1>
            <p className="text-lg text-slate-300">
              Your organizational memory engine for grants
            </p>
          </div>

          {/* Value Proposition */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4 text-left">
            <h2 className="text-lg font-semibold text-white">What you&apos;ll get:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div>
                  <div className="text-white font-medium">Smart Discovery</div>
                  <div className="text-sm text-slate-400">
                    AI-powered matching with funders aligned to your mission
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div>
                  <div className="text-white font-medium">Writing Studio</div>
                  <div className="text-sm text-slate-400">
                    Generate compelling proposals in your organization&apos;s voice
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div>
                  <div className="text-white font-medium">Compliance Guardian</div>
                  <div className="text-sm text-slate-400">
                    Track commitments and avoid conflicts across grants
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div>
                  <div className="text-white font-medium">Pipeline Management</div>
                  <div className="text-sm text-slate-400">
                    Organize and track all opportunities in one place
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleGetStarted}
            size="lg"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  )
}
