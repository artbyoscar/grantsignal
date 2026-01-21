'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, FileText, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'

export default function ProcessingStatusPage() {
  const router = useRouter()
  const { data: orgData } = api.onboarding.getStatus.useQuery()
  const { data: documents } = api.documents.list.useQuery({})
  const completeOnboarding = api.onboarding.complete.useMutation()

  const [processingComplete, setProcessingComplete] = useState(false)
  const [showVoiceAnalysis, setShowVoiceAnalysis] = useState(false)

  const totalDocuments = orgData?._count.documents || 0
  const processedDocuments = documents?.documents.filter((d) => d.status === 'COMPLETED').length || 0
  const processingProgress = totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 100

  useEffect(() => {
    // Check if all documents are processed
    if (totalDocuments > 0 && processedDocuments === totalDocuments) {
      setProcessingComplete(true)
    }

    // Show voice analysis option if 5+ documents
    if (totalDocuments >= 5) {
      setShowVoiceAnalysis(true)
    }
  }, [totalDocuments, processedDocuments])

  const handleContinue = async () => {
    try {
      await completeOnboarding.mutateAsync()
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 4 of 4</span>
            <span className="text-slate-400">100% Complete</span>
          </div>
          <Progress value={100} />
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          {totalDocuments === 0 ? (
            // No documents uploaded
            <>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-white">You&apos;re all set!</h1>
                  <p className="text-slate-400">
                    Your account is ready. You can always upload documents later to enable voice analysis.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleContinue}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
                disabled={completeOnboarding.isPending}
              >
                Continue to Dashboard
              </Button>
            </>
          ) : (
            // Documents are being processed
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">Processing Your Documents</h1>
                <p className="text-slate-400">
                  We&apos;re analyzing your documents to understand your organization&apos;s voice and content
                </p>
              </div>

              {/* Processing Status */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {processingComplete ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      )}
                      <div>
                        <div className="text-white font-medium">
                          {processingComplete ? 'Processing Complete' : 'Processing Documents'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {processedDocuments} of {totalDocuments} documents processed
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {Math.round(processingProgress)}%
                    </div>
                  </div>
                  <Progress value={processingProgress} />
                </div>

                {/* Document List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Documents</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {documents?.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div className="text-sm">
                            <div className="text-white">{doc.name}</div>
                            <div className="text-slate-500 text-xs">
                              {doc.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        {doc.status === 'COMPLETED' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : doc.status === 'PROCESSING' ? (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice Analysis Notice */}
                {showVoiceAnalysis && processingComplete && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="text-white font-medium">Voice Analysis Available</div>
                        <div className="text-sm text-slate-400 mt-1">
                          With {totalDocuments} documents, we can now analyze your organization&apos;s unique voice. This will help generate proposals that sound authentically like you. You can run this analysis from Settings &gt; Voice Profile.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleContinue}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
                disabled={!processingComplete || completeOnboarding.isPending}
              >
                {processingComplete ? 'Continue to Dashboard' : 'Processing...'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
