'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { FileText, Upload, Search, FolderOpen, File, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { DocumentType } from '@prisma/client'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents
  const { data: documents, isLoading, refetch } = api.documents.list.useQuery({
    type: selectedType,
  })

  // Upload mutation
  const createUploadUrlMutation = api.documents.createUploadUrl.useMutation()
  const confirmUploadMutation = api.documents.confirmUpload.useMutation()

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

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by content, name, or funder..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

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
          {!isLoading && documents && documents.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
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
            </div>
          )}

          {/* Document Grid */}
          {!isLoading && documents && documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onClick={() => {
                    // TODO: Open document preview/details
                    toast.info('Document preview coming soon')
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}