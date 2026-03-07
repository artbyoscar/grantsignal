'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Brain,
  Target,
  Calendar,
  DollarSign,
  Building2,
  Mic,
  BookOpen,
  Loader2,
  Sparkles,
  PenTool,
  ClipboardCheck,
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { STANDARD_SECTIONS } from '@/lib/writer/sections'

type WizardStep = 'review' | 'sections' | 'launch'

const READINESS_ITEMS: Array<{
  key: string
  label: string
  description: string
  icon: typeof FileText
  href?: string
  critical: boolean
}> = [
  { key: 'hasFunder', label: 'Funder identified', description: 'Link a funder to this grant', icon: Building2, href: '/pipeline', critical: true },
  { key: 'hasDeadline', label: 'Deadline set', description: 'Set a submission deadline', icon: Calendar, href: '/pipeline', critical: true },
  { key: 'hasAmountRequested', label: 'Amount requested', description: 'Enter the grant amount', icon: DollarSign, href: '/pipeline', critical: false },
  { key: 'hasDocuments', label: 'Supporting documents', description: 'Upload related documents', icon: FileText, href: '/documents?upload=true', critical: false },
  { key: 'hasOrgMemory', label: 'Organization memory (3+ docs)', description: 'AI needs context to generate quality drafts', icon: Brain, href: '/documents', critical: false },
  { key: 'hasVoiceProfile', label: 'Voice profile active', description: 'Captures your writing style for AI drafts', icon: Mic, href: '/settings/voice', critical: false },
  { key: 'hasMission', label: 'Mission statement set', description: 'Grounds AI output in your mission', icon: Target, href: '/settings/organization', critical: false },
]

export default function GrantWriterWizard() {
  const router = useRouter()
  const params = useParams()
  const grantId = params.grantId as string

  const [currentStep, setCurrentStep] = useState<WizardStep>('review')
  const [selectedSections, setSelectedSections] = useState<string[]>(
    STANDARD_SECTIONS.map(s => s.id)
  )

  const { data: readiness, isLoading } = api.writing.getWritingReadiness.useQuery(
    { grantId },
    { enabled: !!grantId }
  )

  if (isLoading || !readiness) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Analyzing writing readiness...</p>
        </div>
      </div>
    )
  }

  const checks = readiness.checks as Record<string, boolean>
  const criticalMissing = READINESS_ITEMS.filter(i => i.critical && !checks[i.key])
  const title = readiness.grant.opportunityTitle || readiness.grant.funderName || 'Untitled Grant'

  const steps: Array<{ id: WizardStep; label: string; icon: typeof PenTool }> = [
    { id: 'review', label: 'Review Readiness', icon: ClipboardCheck },
    { id: 'sections', label: 'Choose Sections', icon: BookOpen },
    { id: 'launch', label: 'Start Writing', icon: PenTool },
  ]

  const stepIndex = steps.findIndex(s => s.id === currentStep)

  function handleToggleSection(sectionId: string) {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  function handleLaunchEditor() {
    router.push(`/write/${grantId}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/pipeline')}
          className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </button>
        <h1 className="text-2xl font-bold text-white">Grant Writer Wizard</h1>
        <p className="text-slate-400 mt-1">{title}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                currentStep === step.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : idx < stepIndex
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
              }`}
            >
              {idx < stepIndex ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <step.icon className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
            {idx < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Readiness Score */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Writing Readiness</h2>
              <div className={`text-2xl font-bold ${
                readiness.readinessScore >= 70 ? 'text-emerald-400' :
                readiness.readinessScore >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {readiness.readinessScore}%
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  readiness.readinessScore >= 70 ? 'bg-emerald-500' :
                  readiness.readinessScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${readiness.readinessScore}%` }}
              />
            </div>

            {criticalMissing.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-300">
                    {criticalMissing.length === 1 ? '1 critical item' : `${criticalMissing.length} critical items`} missing.
                    You can still proceed, but AI quality will be limited.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {READINESS_ITEMS.map(item => {
                const passed = checks[item.key]
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      passed ? 'bg-slate-900/50' : 'bg-slate-900 hover:bg-slate-800/80'
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    )}
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${passed ? 'text-slate-500' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${passed ? 'text-slate-400' : 'text-white'}`}>
                        {item.label}
                      </span>
                      {!passed && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {!passed && item.href && (
                      <button
                        onClick={() => router.push(item.href!)}
                        className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
                      >
                        Fix
                      </button>
                    )}
                    {item.critical && !passed && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Context summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{readiness.totalDocuments}</div>
              <div className="text-xs text-slate-400 mt-1">Grant Docs</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{readiness.orgMemoryDocuments}</div>
              <div className="text-xs text-slate-400 mt-1">Memory Docs</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{readiness.sectionsStarted}</div>
              <div className="text-xs text-slate-400 mt-1">Sections Started</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">
                {readiness.grant.deadline
                  ? Math.max(0, Math.ceil((new Date(readiness.grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : '--'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Days Left</div>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep('sections')}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue to Section Selection
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentStep === 'sections' && (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Proposal Sections</h2>
              <span className="text-sm text-slate-400">
                {selectedSections.length} of {STANDARD_SECTIONS.length} selected
              </span>
            </div>

            {readiness.hasCustomRfpSections && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-300">
                    Custom RFP sections detected. The editor will use your RFP-specific structure.
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-400 mb-4">
              Select which sections to include in your proposal. You can always add or remove sections later.
            </p>

            <div className="space-y-2">
              {STANDARD_SECTIONS.map(section => {
                const isSelected = selectedSections.includes(section.id)
                return (
                  <button
                    key={section.id}
                    onClick={() => handleToggleSection(section.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-slate-900 border border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {section.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          {section.targetWordCount} words
                        </span>
                      </div>
                      {section.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Total target: {STANDARD_SECTIONS.filter(s => selectedSections.includes(s.id)).reduce((sum, s) => sum + s.targetWordCount, 0).toLocaleString()} words
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSections(STANDARD_SECTIONS.map(s => s.id))}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => setSelectedSections([])}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('review')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setCurrentStep('launch')}
              disabled={selectedSections.length === 0}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {currentStep === 'launch' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/10 via-slate-800 to-slate-800 border border-blue-500/20 rounded-lg p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <PenTool className="w-8 h-8 text-blue-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Ready to Write</h2>
              <p className="text-slate-400 mt-2 max-w-md mx-auto">
                You have selected {selectedSections.length} sections totaling{' '}
                {STANDARD_SECTIONS.filter(s => selectedSections.includes(s.id)).reduce((sum, s) => sum + s.targetWordCount, 0).toLocaleString()}{' '}
                target words. The Writing Studio includes AI assistance, memory search, and real-time progress tracking.
              </p>
            </div>

            {/* What's available summary */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="text-center">
                <div className={`text-lg font-bold ${readiness.orgMemoryDocuments >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {readiness.orgMemoryDocuments}
                </div>
                <div className="text-xs text-slate-500">Memory Sources</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${readiness.hasVoiceProfile ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {readiness.hasVoiceProfile ? 'Active' : 'Off'}
                </div>
                <div className="text-xs text-slate-500">Voice Profile</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {readiness.readinessScore}%
                </div>
                <div className="text-xs text-slate-500">Readiness</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <button
                onClick={handleLaunchEditor}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <PenTool className="w-5 h-5" />
                Open Writing Studio
              </button>
              <button
                onClick={() => setCurrentStep('sections')}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Go back and adjust sections
              </button>
            </div>
          </div>

          {/* Writing tips */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Writing Tips</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p>
                <span className="text-slate-300 font-medium">Use Memory Search</span> in the left panel to pull relevant content from your uploaded documents into each section.
              </p>
              <p>
                <span className="text-slate-300 font-medium">AI drafts require 60%+ confidence</span> from your organizational memory. Upload more documents to improve AI quality.
              </p>
              <p>
                <span className="text-slate-300 font-medium">Auto-save is active</span> and your work saves every 2 seconds. The progress panel on the right tracks word counts against targets.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
