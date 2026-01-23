import { FileText, FileSpreadsheet, File, Download, MoreVertical, Eye, Trash2 } from 'lucide-react'
import { DocumentType, ProcessingStatus } from '@/types/client-types'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Document = {
  id: string
  name: string
  type: DocumentType
  status: ProcessingStatus
  size: number
  createdAt: Date
  mimeType: string | null
  grant?: {
    id: string
    funder: {
      name: string
    } | null
  } | null
}

type DocumentCardProps = {
  document: Document
  onClick?: () => void
  onReview?: () => void
  onDelete?: () => void
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

// Get status badge styling
function getStatusBadge(status: ProcessingStatus) {
  const badges = {
    PENDING: {
      text: 'Pending',
      className: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    },
    PROCESSING: {
      text: 'Processing',
      className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    COMPLETED: {
      text: 'Completed',
      className: 'bg-green-500/20 text-green-300 border-green-500/30',
    },
    NEEDS_REVIEW: {
      text: 'Needs Review',
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    FAILED: {
      text: 'Failed',
      className: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
  }

  return badges[status] || badges.PENDING
}

export function DocumentCard({ document, onClick, onReview, onDelete }: DocumentCardProps) {
  const Icon = getFileIcon(document.mimeType)
  const statusBadge = getStatusBadge(document.status)
  const timeAgo = formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })

  return (
    <div
      className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-800/80 hover:border-slate-600 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header with Icon and Menu */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 flex-shrink-0">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-medium text-white truncate group-hover:text-blue-400 transition-colors">
              {document.name}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {formatFileSize(document.size)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                window.open(`/api/documents/${document.id}/download`, '_blank')
              }}
            >
              <Download className="w-4 h-4" />
              Download
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div className="mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border ${statusBadge.className}`}
        >
          {statusBadge.text}
        </span>
      </div>

      {/* Metadata */}
      <div className="space-y-0.5 text-[11px] text-slate-400">
        {document.grant?.funder && (
          <div className="flex items-center gap-1 truncate">
            <span className="text-slate-500">Funder:</span>
            <span className="text-slate-300 truncate">{document.grant.funder.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>Uploaded {timeAgo}</span>
        </div>
      </div>

      {/* Action Button (visible on hover) */}
      <div className="mt-2 pt-2 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {document.status === ProcessingStatus.NEEDS_REVIEW && onReview ? (
          <button
            className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
              onReview()
            }}
          >
            <Eye className="w-3 h-3" />
            Review
          </button>
        ) : (
          <button
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Download document
            }}
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        )}
      </div>
    </div>
  )
}

// Loading skeleton for DocumentCard
export function DocumentCardSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-slate-700 rounded" />
          <div className="flex-1">
            <div className="h-3 bg-slate-700 rounded w-3/4 mb-1.5" />
            <div className="h-2.5 bg-slate-700 rounded w-16" />
          </div>
        </div>
      </div>
      <div className="mb-2">
        <div className="h-5 bg-slate-700 rounded w-20" />
      </div>
      <div className="space-y-1">
        <div className="h-2.5 bg-slate-700 rounded w-full" />
        <div className="h-2.5 bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  )
}