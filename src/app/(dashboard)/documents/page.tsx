'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { FileText, Upload, Search, FolderOpen, File, X, Loader2, AlertCircle, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { DocumentType, ProcessingStatus } from '@prisma/client'
import { DocumentCard, DocumentCardSkeleton } from '@/components/documents/document-card'
import { toast } from 'sonner'

const documentTypes = [
  { name: 'All Documents', value: undefined, icon: FileText },
  { name: 'Proposals', value: DocumentType.PROPOSAL, icon: File },
  { name: 'Reports', value: DocumentType.REPORT, icon: File },
  { name: 'Budgets', value: DocumentType.BUDGET, icon: File },
  { name: 'Award Letters', value: DocumentType.AWARD_LETTER, icon: File },
  { name: 'Other', value: DocumentType.OTHER, icon: File },
]

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

type UploadingFile = {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  documentId?: string
}

export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocumentType | undefined>(undefined)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents
  const { data: documents, isLoading, refetch } = api.documents.list.useQuery({
    type: selectedType,
  })

  // Fetch document health stats
  const { data: health } = api.documents.health.useQuery()

  // Search query (debounced)
  const { data: searchResults, isLoading: isSearching } = api.documents.search.useQuery(
    {
      query: searchQuery,
      type: selectedType,
      limit: 20,
      minScore: 0.6,
    },
    {
      enabled: searchMode && searchQuery.length >= 3,
    }
  )

  // Upload mutation
  const createUploadUrlMutation = api.documents.createUploadUrl.useMutation()
  const confirmUploadMutation = api.documents.confirmUpload.useMutation()

  // Approve document mutation
  const approveDocumentMutation = api.documents.approveDocument.useMutation()

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles: File[] = []

    // Validate files
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File size exceeds 50MB limit.`)
        return
      }

      validFiles.push(file)
    })

    if (validFiles.length === 0) return

    // Start upload for each file
    for (const file of validFiles) {
      await uploadFile(file)
    }
  }

  // Upload a single file
  const uploadFile = async (file: File) => {
    const uploadId = Math.random().toString(36).substring(7)

    // Add to uploading list
    setUploadingFiles(prev => [
      ...prev,
      {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading',
      },
    ])

    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, documentId } = await createUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: DocumentType.OTHER, // Default type, can be changed later
      })

      // Update with document ID
      setUploadingFiles(prev =>
        prev.map(f => (f.id === uploadId ? { ...f, documentId } : f))
      )

      // Step 2: Upload file to S3
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadingFiles(prev =>
            prev.map(f => (f.id === uploadId ? { ...f, progress } : f))
          )
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          // Step 3: Confirm upload and trigger processing
          setUploadingFiles(prev =>
            prev.map(f => (f.id === uploadId ? { ...f, status: 'processing', progress: 100 } : f))
          )

          try {
            await confirmUploadMutation.mutateAsync({ documentId })

            setUploadingFiles(prev =>
              prev.map(f => (f.id === uploadId ? { ...f, status: 'complete' } : f))
            )

            toast.success(`${file.name} uploaded successfully`)

            // Refresh document list
            refetch()

            // Remove from uploading list after a delay
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
            }, 2000)
          } catch (error) {
            throw new Error('Failed to confirm upload')
          }
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload')
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadId ? { ...f, status: 'error', error: errorMessage } : f
        )
      )

      toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  // File input change handler
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // Remove uploading file
  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  // Count documents by type
  const documentCounts = documentTypes.map(type => ({
    ...type,
    count: type.value === undefined
      ? documents?.length || 0
      : documents?.filter((doc: { type: DocumentType }) => doc.type === type.value).length || 0,
  }))

  // Handle reviewing a document
  const handleReviewDocument = (document: any) => {
    setSelectedDocument(document)
    setReviewModalOpen(true)
  }

  // Handle approving a document
  const handleApproveDocument = async () => {
    if (!selectedDocument) return

    try {
      await approveDocumentMutation.mutateAsync({ documentId: selectedDocument.id })
      toast.success('Document approved and marked as completed')
      setReviewModalOpen(false)
      setSelectedDocument(null)
      refetch()
    } catch (error) {
      toast.error('Failed to approve document')
    }
  }

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setSearchMode(value.length >= 3)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
  }

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <mark key={i} className="bg-yellow-400/30 text-yellow-200">{part}</mark> : part
    )
  }

  // Display documents or search results
  const displayDocuments = searchMode && searchResults ? searchResults.results.map(r => r.document) : documents

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 mt-1">Your organizational memory.</p>
        </div>
        <button
          onClick={openFilePicker}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {/* Document Health Section */}
      {health && health.total > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Document Health</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white">{health.completed}</div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white">{health.processing}</div>
                <div className="text-xs text-slate-400">Processing</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white">{health.needsReview}</div>
                <div className="text-xs text-slate-400">Needs Review</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white">{health.failed}</div>
                <div className="text-xs text-slate-400">Failed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Banner for Documents Needing Review */}
      {health && health.needsReview > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-300 mb-1">
                {health.needsReview} {health.needsReview === 1 ? 'document needs' : 'documents need'} review
              </h4>
              <p className="text-sm text-amber-200/80">
                Documents needing review have low extraction confidence. You may need to manually verify the content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by content, name, or funder..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search Status */}
      {searchMode && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-300">
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching documents...</span>
              </>
            ) : searchResults ? (
              <>
                <Search className="w-4 h-4" />
                <span>
                  Found {searchResults.totalDocuments} {searchResults.totalDocuments === 1 ? 'document' : 'documents'}
                  {searchResults.totalChunks > 0 && ` with ${searchResults.totalChunks} relevant ${searchResults.totalChunks === 1 ? 'section' : 'sections'}`}
                </span>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - Document Types */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Document Types</h3>
            <nav className="space-y-1">
              {documentCounts.map((type) => {
                const Icon = type.icon
                const isActive = selectedType === type.value
                return (
                  <button
                    key={type.name}
                    onClick={() => setSelectedType(type.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{type.name}</span>
                    </div>
                    <span className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                      {type.count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Upload Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer mb-6 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <FolderOpen className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-600'}`} />
            <h3 className="text-lg font-medium text-white mb-2">
              {isDragging ? 'Drop files here' : 'Drop files here to upload'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Upload proposals, reports, budgets, and other grant documents
            </p>
            <p className="text-xs text-slate-500">
              Supports PDF, DOCX, DOC, TXT up to 50MB each
            </p>
          </div>

          {/* Uploading Files */}
          {uploadingFiles.length > 0 && (
            <div className="mb-6 space-y-3">
              {uploadingFiles.map((uploadingFile) => (
                <div
                  key={uploadingFile.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {uploadingFile.status === 'uploading' && `Uploading... ${uploadingFile.progress}%`}
                          {uploadingFile.status === 'processing' && 'Processing...'}
                          {uploadingFile.status === 'complete' && 'Complete'}
                          {uploadingFile.status === 'error' && `Error: ${uploadingFile.error}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadingFile.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                      {uploadingFile.status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                      {uploadingFile.status === 'error' && (
                        <button
                          onClick={() => removeUploadingFile(uploadingFile.id)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  {uploadingFile.status === 'uploading' && (
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DocumentCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isSearching && displayDocuments && displayDocuments.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              {searchMode ? (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">
                    Try adjusting your search query or check if documents have been processed.
                  </p>
                  <button
                    onClick={clearSearch}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">
                    Upload your first grant proposal to build your organizational memory.
                  </p>
                  <button
                    onClick={openFilePicker}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Your First Document
                  </button>
                </>
              )}
            </div>
          )}

          {/* Search Results with Snippets */}
          {searchMode && searchResults && searchResults.results.length > 0 && (
            <div className="space-y-4">
              {searchResults.results.map((result) => (
                <div
                  key={result.document.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => {
                    if (result.document.status === ProcessingStatus.NEEDS_REVIEW) {
                      handleReviewDocument(result.document)
                    } else {
                      toast.info('Document preview coming soon')
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {result.document.name}
                      </h3>
                      {result.document.grant?.funder && (
                        <p className="text-sm text-slate-400">
                          {result.document.grant.funder.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-medium text-blue-300">
                        {result.relevanceScore}% match
                      </div>
                      {result.document.status === ProcessingStatus.NEEDS_REVIEW && (
                        <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs font-medium text-amber-300">
                          Needs Review
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matching Text Snippets */}
                  {result.matchingChunks && result.matchingChunks.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {result.matchingChunks.slice(0, 2).map((chunk, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-700 rounded p-3">
                          <p className="text-sm text-slate-300 line-clamp-3">
                            {highlightText(chunk.text.slice(0, 300) + (chunk.text.length > 300 ? '...' : ''), searchQuery)}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <span>{Math.round(chunk.score * 100)}% relevance</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Document Grid (Normal View) */}
          {!isLoading && !searchMode && displayDocuments && displayDocuments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onClick={() => {
                    if (document.status === ProcessingStatus.NEEDS_REVIEW) {
                      handleReviewDocument(document)
                    } else {
                      toast.info('Document preview coming soon')
                    }
                  }}
                  onReview={document.status === ProcessingStatus.NEEDS_REVIEW ? () => handleReviewDocument(document) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReviewModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-3xl max-h-[80vh] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-white">Review Document</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedDocument.name}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Confidence Score */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-300">Low Confidence Score</h3>
                    <p className="text-sm text-amber-200/80 mt-1">
                      Extraction confidence: {selectedDocument.confidenceScore || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {selectedDocument.parseWarnings && Array.isArray(selectedDocument.parseWarnings) && selectedDocument.parseWarnings.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Warnings</h3>
                  <ul className="space-y-2">
                    {selectedDocument.parseWarnings.map((warning: string, index: number) => (
                      <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Text Preview */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Extracted Text Preview</h3>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {selectedDocument.extractedText ? (
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {selectedDocument.extractedText.slice(0, 2000)}
                      {selectedDocument.extractedText.length > 2000 && '\n\n... (truncated)'}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-500">No extracted text available</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {selectedDocument.metadata && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Document Metadata</h3>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {selectedDocument.metadata.wordCount && (
                        <>
                          <dt className="text-slate-500">Word Count:</dt>
                          <dd className="text-slate-300">{selectedDocument.metadata.wordCount}</dd>
                        </>
                      )}
                      {selectedDocument.metadata.pageCount && (
                        <>
                          <dt className="text-slate-500">Pages:</dt>
                          <dd className="text-slate-300">{selectedDocument.metadata.pageCount}</dd>
                        </>
                      )}
                      {selectedDocument.metadata.detectedType && (
                        <>
                          <dt className="text-slate-500">Detected Type:</dt>
                          <dd className="text-slate-300">{selectedDocument.metadata.detectedType}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-800/50">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={openFilePicker}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Re-upload
              </button>
              <button
                onClick={handleApproveDocument}
                disabled={approveDocumentMutation.isPending}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {approveDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}