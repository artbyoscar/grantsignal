'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Loader2, X, ArrowRight } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { DocumentType } from '@prisma/client'

export interface MemorySearchResult {
  documentId: string
  documentName: string
  text: string
  relevanceScore: number
  chunkIndex: number
}

export interface MemorySearchProps {
  onInsert?: (result: MemorySearchResult) => void
  placeholder?: string
  documentType?: DocumentType
  className?: string
}

/**
 * Reusable semantic search component for querying organizational memory
 * Can be embedded in any page that needs document search functionality
 */
export function MemorySearch({
  onInsert,
  placeholder = 'Search organizational memory...',
  documentType,
  className = '',
}: MemorySearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce search query
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
      type: documentType,
      limit: 10,
      minScore: 0.65,
    },
    {
      enabled: debouncedQuery.length >= 3,
    }
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length >= 3)
  }

  // Handle clear
  const handleClear = () => {
    setQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Handle insert
  const handleInsert = (result: MemorySearchResult) => {
    if (onInsert) {
      onInsert(result)
      handleClear()
    }
  }

  // Flatten search results for display
  const flatResults: MemorySearchResult[] =
    searchResults?.results.flatMap((result) =>
      result.matchingChunks.map((chunk) => ({
        documentId: result.document.id,
        documentName: result.document.name,
        text: chunk.text,
        relevanceScore: Math.round(chunk.score * 100),
        chunkIndex: chunk.chunkIndex,
      }))
    ) || []

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(query.length >= 3)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.length >= 3 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-400">Searching documents...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && flatResults.length === 0 && (
            <div className="p-4 text-center">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {debouncedQuery.length < 3
                  ? 'Type at least 3 characters to search'
                  : 'No relevant documents found'}
              </p>
            </div>
          )}

          {/* Results */}
          {!isLoading && flatResults.length > 0 && (
            <>
              <div className="p-3 border-b border-slate-700">
                <p className="text-xs text-slate-400">
                  Found {flatResults.length} relevant {flatResults.length === 1 ? 'section' : 'sections'}
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {flatResults.map((result, idx) => (
                  <div
                    key={`${result.documentId}-${result.chunkIndex}-${idx}`}
                    className="border-b border-slate-700 last:border-0"
                  >
                    <div className="p-3 hover:bg-slate-700/50 transition-colors">
                      {/* Document Name and Score */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-white truncate">
                            {result.documentName}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {result.relevanceScore}%
                        </span>
                      </div>

                      {/* Text Preview */}
                      <p className="text-xs text-slate-300 line-clamp-2 mb-2">
                        {result.text.slice(0, 150)}
                        {result.text.length > 150 ? '...' : ''}
                      </p>

                      {/* Insert Button */}
                      {onInsert && (
                        <button
                          onClick={() => handleInsert(result)}
                          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <span>Insert</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}