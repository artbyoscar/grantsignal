'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Upload, Cloud, FolderOpen, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { uploadToS3 } from '@/lib/upload'
import { DocumentType } from '@/types/client-types'

type UploadingFile = {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  documentId?: string
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default function DocumentConnectionPage() {
  const router = useRouter()
  const updateStep = api.onboarding.updateStep.useMutation()
  const { data: orgData, refetch: refetchOrgData } = api.onboarding.getStatus.useQuery()

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload mutations
  const createUploadUrlMutation = api.documents.createUploadUrl.useMutation()
  const confirmUploadMutation = api.documents.confirmUpload.useMutation()

  const cloudProviders = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: Cloud,
      description: 'Connect your Google Drive',
      available: false,
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: Cloud,
      description: 'Connect your OneDrive',
      available: false,
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: Cloud,
      description: 'Connect your Dropbox',
      available: false,
    },
  ]

  const handleConnect = async (providerId: string) => {
    setSelectedProvider(providerId)
    setIsConnecting(true)
    // TODO: Implement cloud storage OAuth flow
    setTimeout(() => {
      setIsConnecting(false)
    }, 2000)
  }

  const handleContinue = async () => {
    try {
      await updateStep.mutateAsync({ step: 4 })
      router.push('/onboarding/programs')
    } catch (error) {
      console.error('Failed to update step:', error)
    }
  }

  const handleSkip = async () => {
    try {
      await updateStep.mutateAsync({ step: 4 })
      router.push('/onboarding/programs')
    } catch (error) {
      console.error('Failed to skip:', error)
    }
  }

  const handleBack = async () => {
    await updateStep.mutateAsync({ step: 2 })
    router.push('/onboarding/organization')
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

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

      // Step 2: Upload file to S3 with progress tracking
      await uploadToS3(file, uploadUrl, (progress) => {
        setUploadingFiles(prev =>
          prev.map(f => (f.id === uploadId ? { ...f, progress } : f))
        )
      })

      // Step 3: Confirm upload and trigger processing
      setUploadingFiles(prev =>
        prev.map(f => (f.id === uploadId ? { ...f, status: 'processing', progress: 100 } : f))
      )

      await confirmUploadMutation.mutateAsync({ documentId })

      // Show success toast
      toast.success('Document uploaded successfully', {
        description: `${file.name} is being processed.`,
      })

      setUploadingFiles(prev =>
        prev.map(f => (f.id === uploadId ? { ...f, status: 'complete' } : f))
      )

      // Refresh org data to update document count
      refetchOrgData()

      // Remove from uploading list after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
      }, 3000)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadId ? { ...f, status: 'error', error: errorMessage } : f
        )
      )

      toast.error(`Upload failed: ${errorMessage}`, {
        description: file.name,
        action: {
          label: 'Retry',
          onClick: () => {
            removeUploadingFile(uploadId)
            uploadFile(file)
          },
        },
      })
    }
  }

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Step 3 of 6</span>
          </div>
          <Progress value={50} />
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Connect Your Documents</h1>
            <p className="text-slate-400">
              Upload past proposals, reports, and strategic documents to help our AI understand your organization&apos;s voice and priorities
            </p>
          </div>

          {/* Cloud Storage Options */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Connect Cloud Storage</h2>
            <div className="grid gap-3">
              {cloudProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => provider.available && handleConnect(provider.id)}
                  disabled={!provider.available || isConnecting}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    provider.available
                      ? 'border-slate-700 bg-slate-900 hover:border-blue-500 hover:bg-slate-800'
                      : 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-60'
                  } ${selectedProvider === provider.id ? 'border-blue-500 bg-slate-800' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <provider.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white flex items-center gap-2">
                      {provider.name}
                      {!provider.available && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">{provider.description}</div>
                  </div>
                  {provider.available && (
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-slate-400">or</span>
            </div>
          </div>

          {/* Drag and Drop Upload */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Upload Files</h2>
            <div
              onClick={openFilePicker}
              className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Drag and drop files here</p>
                  <p className="text-sm text-slate-400 mt-1">
                    or click to browse (PDF, DOC, DOCX)
                  </p>
                </div>
                <Button variant="outline" type="button" onClick={openFilePicker}>
                  <FolderOpen className="w-4 h-4" />
                  Browse Files
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              We support PDF, Word documents, and text files up to 50MB each
            </p>
          </div>

          {/* Uploading Files Status */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Uploading Documents</h3>
              {uploadingFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {uploadFile.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {uploadFile.status === 'processing' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {uploadFile.status === 'complete' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-slate-400">
                          {uploadFile.status === 'uploading' && `Uploading... ${uploadFile.progress}%`}
                          {uploadFile.status === 'processing' && 'Processing...'}
                          {uploadFile.status === 'complete' && 'Complete'}
                          {uploadFile.status === 'error' && uploadFile.error}
                        </p>
                      </div>
                    </div>
                    {uploadFile.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          removeUploadingFile(uploadFile.id)
                          uploadFile(uploadFile.file)
                        }}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                  {uploadFile.status === 'uploading' || uploadFile.status === 'processing' ? (
                    <Progress value={uploadFile.progress} />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Document Count Indicator */}
          {orgData && orgData._count.documents > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-white font-medium">
                    {orgData._count.documents} document{orgData._count.documents !== 1 ? 's' : ''} uploaded
                  </div>
                  <div className="text-sm text-slate-400">
                    Ready for processing
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={updateStep.isPending}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={updateStep.isPending}
              className="text-slate-400"
            >
              Skip for now
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={updateStep.isPending}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
