'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, Users, FolderOpen, Target, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { data: orgData } = api.onboarding.getStatus.useQuery()
  const { data: programs } = api.programs.list.useQuery()
  const { data: documents } = api.documents.list.useQuery({})
  const { data: invitations } = api.team.listInvitations.useQuery()
  const completeOnboarding = api.onboarding.complete.useMutation()

  // Mark onboarding as complete when component mounts
  useEffect(() => {
    if (!orgData?.onboardingCompleted) {
      completeOnboarding.mutate()
    }
  }, [orgData?.onboardingCompleted])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const setupSummary = [
    {
      icon: Target,
      label: 'Organization Profile',
      value: orgData?.name || 'Not set',
      completed: !!orgData?.name,
    },
    {
      icon: FileText,
      label: 'Documents Uploaded',
      value: `${documents?.length || 0} document${documents?.length !== 1 ? 's' : ''}`,
      completed: (documents?.length || 0) > 0,
    },
    {
      icon: FolderOpen,
      label: 'Programs Added',
      value: `${programs?.length || 0} program${programs?.length !== 1 ? 's' : ''}`,
      completed: (programs?.length || 0) > 0,
    },
    {
      icon: Users,
      label: 'Team Invitations',
      value: `${invitations?.length || 0} invite${invitations?.length !== 1 ? 's' : ''} sent`,
      completed: (invitations?.length || 0) > 0,
    },
  ]

  const getStartedChecklist = [
    {
      title: 'Upload Your Past Proposals',
      description: 'Add historical grant documents to build your organizational memory',
      link: '/documents',
    },
    {
      title: 'Explore Funding Opportunities',
      description: 'Browse matched funding opportunities based on your profile',
      link: '/opportunities',
    },
    {
      title: 'Create Your First Grant',
      description: 'Start tracking a grant opportunity in your pipeline',
      link: '/pipeline',
    },
    {
      title: 'Set Up Your Voice Profile',
      description: 'Analyze your documents to capture your unique writing style',
      link: '/settings/voice',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 6 of 6</span>
          </div>
          <Progress value={100} />
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-8">
          {/* Success Animation */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">You&apos;re all set!</h1>
              <p className="text-lg text-slate-400">
                Your GrantSignal account is ready to help you find and win more grants
              </p>
            </div>
          </div>

          {/* Setup Summary */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">What You&apos;ve Configured</h2>
            <div className="grid gap-3">
              {setupSummary.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    item.completed
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.completed ? 'bg-blue-500/10' : 'bg-slate-800'
                  }`}>
                    <item.icon className={`w-5 h-5 ${
                      item.completed ? 'text-blue-500' : 'text-slate-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{item.label}</div>
                    <div className="text-sm text-slate-400">{item.value}</div>
                  </div>
                  {item.completed && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started Checklist */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">Getting Started Checklist</h2>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg divide-y divide-slate-700">
              {getStartedChecklist.map((item, index) => (
                <button
                  key={index}
                  onClick={() => router.push(item.link)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-white font-medium">{item.title}</div>
                    <div className="text-sm text-slate-400 mt-1">{item.description}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleContinue}
              size="lg"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Optional Tour Link */}
          <div className="text-center">
            <button
              onClick={() => {
                // TODO: Implement product tour
                router.push('/dashboard')
              }}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Take a quick tour
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
