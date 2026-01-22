'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import {
  Search,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react'

interface ResearchFunderModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ResearchFunderModal({ isOpen, onClose }: ResearchFunderModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [ein, setEin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const createMutation = api.funders.create.useMutation()

  // Use query with enabled: false so it doesn't auto-fetch
  const searchQuery_trpc = api.funders.search.useQuery(
    {
      query: searchQuery.trim(),
      limit: 10,
    },
    {
      enabled: false,
    }
  )

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setError(null)
    setSearchResults([])
    setShowCreateForm(false)

    try {
      // Manually trigger the search
      const { data } = await searchQuery_trpc.refetch()

      const results = data || []
      setSearchResults(results)

      if (results.length === 0) {
        setShowCreateForm(true)
      }
    } catch (err) {
      setError('Failed to search funders. Please try again.')
      console.error(err)
    }
  }

  const handleCreateFunder = async () => {
    if (!searchQuery.trim()) return

    // Validate EIN format if provided (should be 9 digits)
    if (ein && !/^\d{2}-?\d{7}$/.test(ein)) {
      setError('EIN must be in format: 12-3456789 (9 digits)')
      return
    }

    setError(null)

    try {
      const newFunder = await createMutation.mutateAsync({
        name: searchQuery.trim(),
        ein: ein.trim() || undefined,
        type: 'PRIVATE_FOUNDATION',
        sync990: !!ein, // Only sync if EIN provided
      })

      // Navigate to the new funder profile
      router.push(`/opportunities/funders/${newFunder.id}`)
      onClose()
    } catch (err) {
      setError('Failed to create funder. Please try again.')
      console.error(err)
    }
  }

  const handleSelectFunder = (funderId: string) => {
    router.push(`/opportunities/funders/${funderId}`)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searchQuery_trpc.isLoading) {
      handleSearch()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Research Funder</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Foundation Name or EIN
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Gates Foundation or 12-3456789"
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                disabled={searchQuery_trpc.isLoading || createMutation.isPending}
              />
              <button
                onClick={handleSearch}
                disabled={searchQuery_trpc.isLoading || createMutation.isPending || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searchQuery_trpc.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Search by foundation name or EIN (Tax ID)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 font-medium">Error</p>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Found {searchResults.length} Funder{searchResults.length !== 1 ? 's' : ''}</h3>
              <div className="space-y-2">
                {searchResults.map(funder => (
                  <button
                    key={funder.id}
                    onClick={() => handleSelectFunder(funder.id)}
                    className="w-full bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg p-4 text-left transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-5 h-5 text-blue-400" />
                          <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                            {funder.name}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                          {funder.ein && <span>EIN: {funder.ein}</span>}
                          {(funder.city || funder.state) && (
                            <span>
                              {funder.city}
                              {funder.city && funder.state && ', '}
                              {funder.state}
                            </span>
                          )}
                          {funder.totalGiving && (
                            <span className="text-emerald-400 font-medium">
                              ${Number(funder.totalGiving).toLocaleString()} giving
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Funder Form */}
          {showCreateForm && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Funder Not Found
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Would you like to create a new funder record? If you provide an EIN,
                    we'll automatically fetch 990 data from ProPublica.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">
                        Foundation Name
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        disabled={createMutation.isPending}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">
                        EIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={ein}
                        onChange={e => setEin(e.target.value)}
                        placeholder="12-3456789"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        disabled={createMutation.isPending}
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Format: 12-3456789. If provided, we'll fetch 990 data automatically.
                      </p>
                    </div>

                    <button
                      onClick={handleCreateFunder}
                      disabled={createMutation.isPending || !searchQuery.trim()}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating & Syncing 990 Data...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Create Funder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!searchQuery_trpc.isLoading && !searchResults.length && !showCreateForm && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                Enter a foundation name or EIN to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
