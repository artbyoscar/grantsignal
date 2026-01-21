'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  documentId: string
  grantId: string
  documentName: string
}

export function ExtractCommitmentsButton({ documentId, grantId, documentName }: Props) {
  const [showModal, setShowModal] = useState(false)

  const extractMutation = api.compliance.extractCommitments.useMutation({
    onSuccess: (result) => {
      toast.success(`Extracted ${result.count} commitments from ${documentName}`)
      setShowModal(false)
    },
    onError: (error) => {
      toast.error(`Extraction failed: ${error.message}`)
    }
  })

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Extract Commitments
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Extract Commitments</h3>
            <p className="text-slate-300 mb-6">
              Use AI to analyze <span className="font-medium">{documentName}</span> and extract all commitments, deliverables, and metrics.
            </p>

            {extractMutation.isPending && (
              <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-blue-400 font-medium">Analyzing document...</p>
                    <p className="text-blue-300/80 text-sm">This may take 10-30 seconds</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={extractMutation.isPending}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => extractMutation.mutate({ documentId, grantId })}
                disabled={extractMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
