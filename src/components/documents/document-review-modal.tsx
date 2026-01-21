'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { DocumentHealthItem } from '@/types/document-health'

interface DocumentReviewModalProps {
  document: DocumentHealthItem
  isOpen: boolean
  onClose: () => void
  onSave: (documentId: string, updates: { extractedText?: string; metadata?: any; confidenceScore?: number }) => Promise<void>
}

export function DocumentReviewModal({
  document,
  isOpen,
  onClose,
  onSave,
}: DocumentReviewModalProps) {
  const [extractedText, setExtractedText] = useState(document.extractedText || '')
  const [metadata, setMetadata] = useState(JSON.stringify(document.metadata || {}, null, 2))
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'text' | 'metadata'>('text')

  useEffect(() => {
    setExtractedText(document.extractedText || '')
    setMetadata(JSON.stringify(document.metadata || {}, null, 2))
    setHasChanges(false)
  }, [document])

  useEffect(() => {
    const textChanged = extractedText !== (document.extractedText || '')
    const metadataChanged = metadata !== JSON.stringify(document.metadata || {}, null, 2)
    setHasChanges(textChanged || metadataChanged)
  }, [extractedText, metadata, document])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let parsedMetadata
      try {
        parsedMetadata = JSON.parse(metadata)
      } catch (error) {
        parsedMetadata = document.metadata
      }

      await onSave(document.id, {
        extractedText: extractedText !== document.extractedText ? extractedText : undefined,
        metadata: metadata !== JSON.stringify(document.metadata || {}, null, 2) ? parsedMetadata : undefined,
        confidenceScore: 100, // Set to 100 after manual correction
      })

      onClose()
    } catch (error) {
      console.error('Error saving corrections:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-white truncate">
                {document.name}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {document.confidenceScore !== null && (
                <ConfidenceBadge score={document.confidenceScore} size="sm" />
              )}
              {document.grant?.funder && (
                <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
                  {document.grant.funder.name}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Issues Banner */}
        {document.issues && document.issues.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-300 mb-2">
                  Issues Found ({document.issues.length})
                </h3>
                <ul className="space-y-1">
                  {document.issues.slice(0, 3).map((issue, idx) => (
                    <li key={idx} className="text-sm text-amber-200/80 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{issue.message}</span>
                    </li>
                  ))}
                  {document.issues.length > 3 && (
                    <li className="text-sm text-amber-200/60 italic">
                      +{document.issues.length - 3} more issues
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Extracted Text
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Metadata
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original/Read-only Side */}
            <div>
              <Label className="text-slate-300 mb-2 block">
                Original {activeTab === 'text' ? 'Text' : 'Metadata'}
              </Label>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                {activeTab === 'text' ? (
                  document.extractedText ? (
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {document.extractedText}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500">No extracted text available</p>
                  )
                ) : (
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(document.metadata || {}, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Editable Side */}
            <div>
              <Label className="text-slate-300 mb-2 block">
                Corrected {activeTab === 'text' ? 'Text' : 'Metadata'}
              </Label>
              {activeTab === 'text' ? (
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-96 font-mono text-sm bg-slate-900 border-slate-700 text-slate-300"
                  placeholder="Edit extracted text..."
                />
              ) : (
                <Textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  className="min-h-96 font-mono text-sm bg-slate-900 border-slate-700 text-slate-300"
                  placeholder="Edit metadata (JSON format)..."
                />
              )}
              {hasChanges && (
                <p className="text-xs text-amber-400 mt-2">
                  * You have unsaved changes
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="text-sm text-slate-400">
            {hasChanges ? (
              <span className="text-amber-400">Unsaved changes</span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Corrections
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
