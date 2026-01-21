'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, FileText } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { DocumentType } from '@prisma/client'
import { toast } from 'sonner'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'

interface MemorySearchProps {
  onInsert: (text: string, source: { documentId: string; documentName: string }) => void
}

const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.PROPOSAL]: 'Proposal',
  [DocumentType.REPORT]: 'Report',
  [DocumentType.BUDGET]: 'Budget',
  [DocumentType.AWARD_LETTER]: 'Award Letter',
  [DocumentType.OTHER]: 'Other',
}

const documentTypeColors: Record<DocumentType, string> = {
  [DocumentType.PROPOSAL]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [DocumentType.REPORT]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [DocumentType.BUDGET]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [DocumentType.AWARD_LETTER]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [DocumentType.OTHER]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function MemorySearch({ onInsert }: MemorySearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Search query
  const { data: searchResults, isLoading } = api.documents.search.useQuery(
    {
      query: debouncedQuery,
      limit: 20,
      minScore: 0.6,
    },
    {
      enabled: debouncedQuery.length >= 3,
    }
  )

  const handleInsert = (
    text: string,
    documentId: string,
    documentName: string
  ) => {
    onInsert(text, { documentId, documentName })
    toast.success(`Content inserted from ${documentName}`)
  }

  const showEmptyState = !query
  const showNoResults =
    query.length >= 3 &&
    debouncedQuery === query &&
    !isLoading &&
    searchResults?.results.length === 0
  const showResults =
    query.length >= 3 &&
    !isLoading &&
    searchResults &&
    searchResults.results.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Search Input */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search your organizational memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && query.length >= 3 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Searching documents...</p>
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 max-w-xs">
              Search your organizational memory to find relevant past content
            </p>
          </div>
        )}

        {/* No Results State */}
        {showNoResults && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 max-w-xs">
              No matching content found. Try different keywords.
            </p>
          </div>
        )}

        {/* Results List */}
        {showResults && (
          <div className="p-4 space-y-3">
            {searchResults.results.map((result) =>
              result.matchingChunks.map((chunk, chunkIdx) => {
                const score = Math.round(chunk.score * 100)
                const isLowConfidence = score < 60

                return (
                  <div
                    key={`${result.document.id}-${chunkIdx}`}
                    className={`bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors ${
                      isLowConfidence ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Header: Document Name and Type Badge */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate text-sm">
                          {result.document.name}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border flex-shrink-0 ${
                          documentTypeColors[result.document.type]
                        }`}
                      >
                        {documentTypeLabels[result.document.type]}
                      </span>
                    </div>

                    {/* Text Excerpt */}
                    <p className="text-xs text-slate-300 mb-3 line-clamp-3">
                      {chunk.text.slice(0, 200)}
                      {chunk.text.length > 200 ? '...' : ''}
                    </p>

                    {/* Low Confidence Warning */}
                    {isLowConfidence && (
                      <div className="mb-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
                        Low relevance - verify accuracy before use
                      </div>
                    )}

                    {/* Footer: Confidence Badge and Insert Button */}
                    <div className="flex items-center justify-between gap-3">
                      <ConfidenceBadge score={score} size="sm" />
                      <button
                        onClick={() =>
                          handleInsert(
                            chunk.text,
                            result.document.id,
                            result.document.name
                          )
                        }
                        disabled={isLowConfidence}
                        className={`px-3 py-1.5 text-white text-xs font-medium rounded transition-colors ${
                          isLowConfidence
                            ? 'bg-slate-600 cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        title={isLowConfidence ? 'Cannot insert low confidence content' : 'Insert content'}
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
