'use client'

import { useState } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { DocumentHealthStats } from '@/components/documents/document-health-stats'
import { DocumentHealthTable } from '@/components/documents/document-health-table'
import { DocumentReviewModal } from '@/components/documents/document-review-modal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { HealthFilter, DocumentHealthItem } from '@/types/document-health'

const filterTabs: { label: string; value: HealthFilter; description: string }[] = [
  { label: 'All', value: 'all', description: 'All documents' },
  { label: 'Successful', value: 'successful', description: '≥ 80% confidence' },
  { label: 'Needs Review', value: 'needs-review', description: '60-79% confidence' },
  { label: 'Failed', value: 'failed', description: '< 60% confidence' },
]

export default function DocumentHealthPage() {
  const [activeFilter, setActiveFilter] = useState<HealthFilter>('all')
  const [selectedDocument, setSelectedDocument] = useState<DocumentHealthItem | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Fetch health stats
  const { data: stats, isLoading: statsLoading } = api.documents.getHealthStats.useQuery()

  // Fetch documents by health status
  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = api.documents.getDocumentsByHealth.useQuery({
    filter: activeFilter,
  })

  // Mutations
  const updateCorrectionsMutation = api.documents.updateDocumentCorrections.useMutation()
  const reprocessMutation = api.documents.reprocessDocument.useMutation()
  const deleteMutation = api.documents.deleteDocument.useMutation()

  const handleReviewDocument = (document: DocumentHealthItem) => {
    setSelectedDocument(document)
    setIsReviewModalOpen(true)
  }

  const handleSaveCorrections = async (
    documentId: string,
    updates: { extractedText?: string; metadata?: any; confidenceScore?: number }
  ) => {
    try {
      await updateCorrectionsMutation.mutateAsync({
        documentId,
        ...updates,
      })

      toast.success('Document corrections saved successfully')
      refetchDocuments()
    } catch (error) {
      toast.error('Failed to save corrections')
      throw error
    }
  }

  const handleReprocessDocument = async (documentId: string) => {
    try {
      await reprocessMutation.mutateAsync({ documentId })
      toast.success('Document reprocessing started')
      refetchDocuments()
    } catch (error) {
      toast.error('Failed to reprocess document')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      await deleteMutation.mutateAsync({ documentId })
      toast.success('Document deleted successfully')
      refetchDocuments()
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const isLoading = statsLoading || documentsLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/documents"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Documents
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold">Health Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">Document Health Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Monitor parse confidence and quality across all uploaded documents
          </p>
        </div>
        <Link href="/documents">
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <FileText className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 bg-slate-800 border border-slate-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <DocumentHealthStats stats={stats} />
      ) : null}

      {/* Alert for documents needing review */}
      {stats && stats.needsReview > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-300 mb-1">
                {stats.needsReview} {stats.needsReview === 1 ? 'document needs' : 'documents need'}{' '}
                review
              </h4>
              <p className="text-sm text-amber-200/80">
                Documents with medium confidence scores should be reviewed to ensure accuracy.
                Click "Review" to verify and correct the extracted content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.value
          const count =
            tab.value === 'all'
              ? stats?.total || 0
              : tab.value === 'successful'
              ? stats?.successful || 0
              : tab.value === 'needs-review'
              ? stats?.needsReview || 0
              : stats?.failed || 0

          return (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Documents Table */}
      {documentsLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading documents...</p>
        </div>
      ) : documents ? (
        <DocumentHealthTable
          documents={documents}
          onReviewDocument={handleReviewDocument}
          onReprocessDocument={handleReprocessDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      ) : null}

      {/* Review Modal */}
      {selectedDocument && (
        <DocumentReviewModal
          document={selectedDocument}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false)
            setSelectedDocument(null)
          }}
          onSave={handleSaveCorrections}
        />
      )}
    </div>
  )
}
