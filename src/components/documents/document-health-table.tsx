'use client'

import { useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  File,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DocumentType, ProcessingStatus } from '@/types/client-types'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DocumentHealthItem, DocumentIssue, HealthFilter } from '@/types/document-health'

interface DocumentHealthTableProps {
  documents: DocumentHealthItem[]
  onReviewDocument: (document: DocumentHealthItem) => void
  onReprocessDocument: (documentId: string) => void
  onDeleteDocument: (documentId: string) => void
}

// Get icon based on mime type
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File

  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileSpreadsheet
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText

  return File
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Issue severity badge
function IssueSeverityBadge({ severity }: { severity: DocumentIssue['severity'] }) {
  const colors = {
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
  }

  return (
    <Badge variant="outline" className={colors[severity]}>
      {severity}
    </Badge>
  )
}

// Expandable issues list
function IssuesList({ issues }: { issues: DocumentIssue[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (issues.length === 0) {
    return <span className="text-slate-500 text-sm">No issues</span>
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
      >
        <span className="font-medium">{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <ul className="mt-2 space-y-2">
          {issues.map((issue, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs">
              <IssueSeverityBadge severity={issue.severity} />
              <div className="flex-1">
                <p className="text-slate-300">{issue.message}</p>
                {issue.pageNumbers && issue.pageNumbers.length > 0 && (
                  <p className="text-slate-500 mt-1">
                    Pages: {issue.pageNumbers.join(', ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Document row with actions
function DocumentRow({
  document,
  onReview,
  onReprocess,
  onDelete
}: {
  document: DocumentHealthItem
  onReview: () => void
  onReprocess: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)
  const Icon = getFileIcon(document.mimeType)
  const uploadDate = formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })

  return (
    <TableRow className="group hover:bg-slate-800/50">
      {/* Document Name & Icon */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 flex-shrink-0">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate max-w-xs">{document.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatFileSize(document.size)} • {uploadDate}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Upload Date */}
      <TableCell>
        <div className="text-sm text-slate-400">
          {new Date(document.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </TableCell>

      {/* Parse Confidence */}
      <TableCell>
        {document.confidenceScore !== null ? (
          <ConfidenceBadge score={document.confidenceScore} size="sm" />
        ) : (
          <Badge variant="outline" className="bg-slate-500/20 text-slate-300 border-slate-500/30">
            N/A
          </Badge>
        )}
      </TableCell>

      {/* Issues */}
      <TableCell>
        <IssuesList issues={document.issues} />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onReview}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
            title="Review"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onReprocess}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-300"
            title="Reprocess"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function DocumentHealthTable({
  documents,
  onReviewDocument,
  onReprocessDocument,
  onDeleteDocument,
}: DocumentHealthTableProps) {
  if (documents.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No documents found</h3>
        <p className="text-slate-400">
          Try adjusting your filters or upload new documents.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-slate-800">
            <TableHead className="text-slate-400">Document Name</TableHead>
            <TableHead className="text-slate-400">Upload Date</TableHead>
            <TableHead className="text-slate-400">Parse Confidence</TableHead>
            <TableHead className="text-slate-400">Issues Found</TableHead>
            <TableHead className="text-slate-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              onReview={() => onReviewDocument(document)}
              onReprocess={() => onReprocessDocument(document.id)}
              onDelete={() => onDeleteDocument(document.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
