'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import {
  Building2,
  TrendingUp,
  Users,
  FileText,
  History,
  ExternalLink,
  RefreshCw,
  Loader2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
  StickyNote,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Tab = 'overview' | 'giving-history' | 'past-grantees' | 'application' | 'your-history'

export default function FunderProfilePage() {
  const params = useParams()
  const funderId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Fetch funder data
  const { data: funder, isLoading, refetch } = api.funders.getById.useQuery({ funderId })
  const { data: givingHistory } = api.funders.getGivingHistory.useQuery({ funderId })
  const { data: peerIntel } = api.funders.getPeerIntelligence.useQuery({ funderId })

  // Sync mutation
  const syncMutation = api.funders.sync990.useMutation({
    onSuccess: () => {
      setTimeout(() => refetch(), 3000) // Refetch after a delay
    },
  })

  const handleSync = () => {
    syncMutation.mutate({ funderId })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!funder) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Funder not found</h2>
        <p className="text-slate-400">The funder you're looking for doesn't exist.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Building2 },
    { id: 'giving-history' as Tab, label: 'Giving History', icon: TrendingUp },
    { id: 'past-grantees' as Tab, label: 'Past Grantees', icon: Users },
    { id: 'application' as Tab, label: 'Application Info', icon: FileText },
    { id: 'your-history' as Tab, label: 'Your History', icon: History },
  ]

  // Helper function to get initials from funder name
  const getInitials = (name: string) => {
    const words = name.split(' ').filter(Boolean)
    if (words.length === 0) return 'F'
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  // Helper function to format funder type
  const formatFunderType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Helper function to get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'PRIVATE_FOUNDATION':
        return 'bg-blue-900/30 text-blue-300 border-blue-700'
      case 'COMMUNITY_FOUNDATION':
        return 'bg-purple-900/30 text-purple-300 border-purple-700'
      case 'CORPORATE':
        return 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
      case 'FEDERAL':
        return 'bg-red-900/30 text-red-300 border-red-700'
      case 'STATE':
        return 'bg-orange-900/30 text-orange-300 border-orange-700'
      case 'LOCAL':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              {/* Funder Logo/Avatar */}
              <Avatar className="w-[120px] h-[120px] border-2 border-slate-700">
                {/* TODO: Add logoUrl field to Funder model in schema */}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl font-bold">
                  {getInitials(funder.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{funder.name}</h1>

                {/* Type Badge */}
                <Badge className={`mb-3 border ${getTypeBadgeColor(funder.type)}`} variant="outline">
                  {formatFunderType(funder.type)}
                </Badge>

                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {funder.ein && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>EIN: {funder.ein}</span>
                </div>
              )}
              {(funder.city || funder.state) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {funder.city}
                    {funder.city && funder.state && ', '}
                    {funder.state}
                  </span>
                </div>
              )}
              {funder.website && (
                <a
                  href={funder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {funder.totalAssets && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Total Assets</div>
                  <div className="text-2xl font-bold text-white">
                    ${Number(funder.totalAssets).toLocaleString()}
                  </div>
                </div>
              )}
              {funder.totalGiving && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Annual Giving</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${Number(funder.totalGiving).toLocaleString()}
                  </div>
                </div>
              )}
              {(funder.grantSizeMedian || (funder.grantSizeMin && funder.grantSizeMax)) && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Typical Grant Size</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {funder.grantSizeMedian ? (
                      `$${Number(funder.grantSizeMedian).toLocaleString()}`
                    ) : funder.grantSizeMin && funder.grantSizeMax ? (
                      `$${Number(funder.grantSizeMin).toLocaleString()} - $${Number(funder.grantSizeMax).toLocaleString()}`
                    ) : null}
                  </div>
                  {funder.grantSizeMin && funder.grantSizeMax && funder.grantSizeMedian && (
                    <div className="text-xs text-slate-500 mt-1">
                      Range: ${Number(funder.grantSizeMin).toLocaleString()} - ${Number(funder.grantSizeMax).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sync Button */}
          {funder.ein && (
            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
              />
              {syncMutation.isPending ? 'Syncing...' : 'Sync 990'}
            </button>
          )}
        </div>

        {funder.lastSyncedAt && (
          <div className="mt-4 text-sm text-slate-500">
            Last synced: {new Date(funder.lastSyncedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab funder={funder} peerIntel={peerIntel} />
        )}
        {activeTab === 'giving-history' && (
          <GivingHistoryTab givingHistory={givingHistory} />
        )}
        {activeTab === 'past-grantees' && (
          <PastGranteesTab grantees={funder.pastGrantees} />
        )}
        {activeTab === 'application' && <ApplicationTab funder={funder} />}
        {activeTab === 'your-history' && (
          <YourHistoryTab grants={funder.grants} />
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-xl z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {funder.opportunities && funder.opportunities.length > 0 && (
                <span>{funder.opportunities.length} open opportunity(ies) available</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // TODO: Implement Set Alert functionality
                  alert('Set Alert feature coming soon!')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                Set Alert
              </button>
              {funder.opportunities && funder.opportunities.length > 0 && (
                <button
                  onClick={() => {
                    // Navigate to opportunities tab or list
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Open Opportunities ({funder.opportunities.length})
                </button>
              )}
              <button
                onClick={() => {
                  // TODO: Implement Add to Pipeline functionality
                  alert('Add to Pipeline feature coming soon!')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add to Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind sticky bar */}
      <div className="h-20" />
    </div>
  )
}

// Tab Components

function OverviewTab({ funder, peerIntel }: { funder: any; peerIntel: any }) {
  return (
    <div className="space-y-6">
      {/* Mission */}
      {funder.mission && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Mission</h2>
          <p className="text-slate-300 leading-relaxed">{funder.mission}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Areas */}
        {funder.programAreas && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Program Areas</h2>
            <div className="flex flex-wrap gap-2">
              {(funder.programAreas as string[]).map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Focus */}
        {funder.geographicFocus && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Geographic Focus</h2>
            <div className="flex flex-wrap gap-2">
              {(funder.geographicFocus as string[]).map((location, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-emerald-900/30 text-emerald-300 rounded-full text-sm"
                >
                  {location}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Peer Intelligence Widget */}
      {peerIntel && peerIntel.peers.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Peer Intelligence</h2>
          </div>
          <p className="text-slate-300 mb-4">
            Organizations similar to yours that have received grants from this funder
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Average Grant</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${Math.round(peerIntel.averageGrant).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Total Grants</div>
              <div className="text-2xl font-bold text-blue-400">
                {peerIntel.totalGrants}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Years Tracked</div>
              <div className="text-2xl font-bold text-purple-400">
                {peerIntel.years.length}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-white">Top Recipients</h3>
            {peerIntel.peers.slice(0, 5).map((peer: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-white">{peer.recipientName}</div>
                  <div className="text-sm text-slate-400">
                    {peer.grantCount} grant{peer.grantCount > 1 ? 's' : ''} • Last:{' '}
                    {peer.latestYear}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">
                    ${peer.totalReceived.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function GivingHistoryTab({ givingHistory }: { givingHistory: any }) {
  if (!givingHistory || givingHistory.filings.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No giving history available</h3>
        <p className="text-slate-400">
          990 data will appear here once synced from ProPublica.
        </p>
      </div>
    )
  }

  // Calculate year-over-year growth
  const filings5Year = givingHistory.filings.slice(0, 5)
  const growthData = filings5Year.map((filing: any, idx: number) => {
    if (idx === filings5Year.length - 1) return { ...filing, growth: null }
    const previousFiling = filings5Year[idx + 1]
    const growth = previousFiling.totalGiving > 0
      ? ((filing.totalGiving - previousFiling.totalGiving) / previousFiling.totalGiving) * 100
      : 0
    return { ...filing, growth }
  })

  // Calculate average growth
  const validGrowth = growthData.filter((f: any) => f.growth !== null).map((f: any) => f.growth)
  const avgGrowth = validGrowth.length > 0
    ? validGrowth.reduce((sum: number, g: number) => sum + g, 0) / validGrowth.length
    : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Latest Year Giving</div>
          <div className="text-2xl font-bold text-emerald-400">
            ${filings5Year[0].totalGiving.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">FY {filings5Year[0].year}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Average Growth (YoY)</div>
          <div className={`text-2xl font-bold ${avgGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {avgGrowth >= 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Last 5 years</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">5-Year Total</div>
          <div className="text-2xl font-bold text-blue-400">
            ${filings5Year.reduce((sum: number, f: any) => sum + f.totalGiving, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Combined giving</div>
        </div>
      </div>

      {/* 5-Year Trend Chart with Growth */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">5-Year Giving Trends</h2>
        <div className="space-y-4">
          {growthData.map((filing: any, idx: number) => {
            const maxGiving = Math.max(...filings5Year.map((f: any) => f.totalGiving))
            const percentage = (filing.totalGiving / maxGiving) * 100

            return (
              <div key={idx}>
                <div className="flex justify-between items-center text-sm mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium w-12">{filing.year}</span>
                    {filing.growth !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        filing.growth >= 0
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {filing.growth >= 0 ? '+' : ''}{filing.growth.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <span className="text-emerald-400 font-medium">
                    ${filing.totalGiving.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Assets vs. Giving Comparison */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Assets vs. Giving Comparison</h2>
        <div className="space-y-4">
          {filings5Year.map((filing: any, idx: number) => {
            const maxValue = Math.max(
              ...filings5Year.map((f: any) => Math.max(f.totalAssets, f.totalGiving))
            )
            const assetsPercentage = (filing.totalAssets / maxValue) * 100
            const givingPercentage = (filing.totalGiving / maxValue) * 100
            const payoutRate = filing.totalAssets > 0
              ? (filing.totalGiving / filing.totalAssets) * 100
              : 0

            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white font-medium">{filing.year}</span>
                  <span className="text-xs text-slate-400">
                    Payout Rate: {payoutRate.toFixed(2)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-16">Assets:</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${assetsPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 w-32 text-right">
                      ${filing.totalAssets.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-16">Giving:</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${givingPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 w-32 text-right">
                      ${filing.totalGiving.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-slate-400">Total Assets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-slate-400">Total Giving</span>
          </div>
        </div>
      </div>

      {/* Detailed Filings Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Historical 990 Filings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Year</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">
                  Total Assets
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">
                  Total Revenue
                </th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">
                  Total Giving
                </th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">990 PDF</th>
              </tr>
            </thead>
            <tbody>
              {givingHistory.filings.map((filing: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-700/50">
                  <td className="py-3 px-4 text-white">{filing.year}</td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    ${filing.totalAssets.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    ${filing.totalRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                    ${filing.totalGiving.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {filing.pdfUrl && (
                      <a
                        href={filing.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 inline" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PastGranteesTab({ grantees }: { grantees: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Fetch organization data for "Similar to You" comparison
  // TODO: Fix type issue with organizations router
  const organization = undefined as any

  if (!grantees || grantees.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No past grantees available</h3>
        <p className="text-slate-400">
          Schedule I data will appear here once 990 forms are processed.
        </p>
      </div>
    )
  }

  // Get unique years
  const years = [...new Set(grantees.map(g => g.year))].sort((a, b) => b - a)

  // Filter grantees
  const filteredGrantees = grantees.filter(g => {
    const matchesSearch = g.recipientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesYear = yearFilter === null || g.year === yearFilter
    return matchesSearch && matchesYear
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredGrantees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedGrantees = filteredGrantees.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleYearChange = (value: number | null) => {
    setYearFilter(value)
    setCurrentPage(1)
  }

  // Helper function to check if grantee is similar to your org
  const isSimilarToYou = (grantee: any) => {
    if (!organization?.primaryProgramAreas || organization.primaryProgramAreas.length === 0) {
      return false
    }

    // Check if grantee purpose matches any of your program areas
    if (grantee.purpose) {
      const purposeLower = grantee.purpose.toLowerCase()
      return organization.primaryProgramAreas.some((area: string) =>
        purposeLower.includes(area.toLowerCase()) || area.toLowerCase().includes(purposeLower)
      )
    }

    return false
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search recipients..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={yearFilter || ''}
            onChange={e => handleYearChange(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grantees Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Past Recipients ({filteredGrantees.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">
                  Recipient
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">EIN</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Amount</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Year</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGrantees.map((grantee, idx) => {
                const similarToYou = isSimilarToYou(grantee)
                return (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{grantee.recipientName}</span>
                        {similarToYou && (
                          <Badge className="bg-purple-900/30 text-purple-300 border-purple-700 text-xs" variant="outline">
                            Similar to You
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {grantee.recipientEin || '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      ${Number(grantee.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">{grantee.year}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {grantee.purpose || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredGrantees.length)} of {filteredGrantees.length} recipients
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationTab({ funder }: { funder: any }) {
  const contactInfo = funder.contactInfo as any

  return (
    <div className="space-y-6">
      {/* Application Process */}
      {funder.applicationProcess && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Application Process</h2>
          <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {funder.applicationProcess}
          </div>
        </div>
      )}

      {/* Required Documents Checklist */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Required Documents</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Proposal Narrative',
            'Project Budget',
            'Organization Budget',
            'IRS 501(c)(3) Determination Letter',
            'Board of Directors List',
            'Financial Statements',
            'Letters of Support',
            'Logic Model or Theory of Change'
          ].map((doc, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg">
              <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-600 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-slate-300 text-sm">{doc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Note: Requirements may vary. Check funder website for specific documentation needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines */}
        {funder.applicationDeadline && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Deadlines</h2>
            </div>
            <p className="text-slate-300">{funder.applicationDeadline}</p>
          </div>
        )}

        {/* Contact Information */}
        {contactInfo && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="space-y-3">
              {contactInfo.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}
              {contactInfo.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{contactInfo.phone}</span>
                </div>
              )}
              {contactInfo.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                  <span className="text-slate-300">{contactInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tips for Success */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Tips for Success</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <div>
              <p className="text-slate-200 font-medium">Align with funder priorities</p>
              <p className="text-slate-400 text-sm">Clearly demonstrate how your project matches their program areas and mission.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <p className="text-slate-200 font-medium">Follow instructions precisely</p>
              <p className="text-slate-400 text-sm">Pay close attention to formatting, length requirements, and submission procedures.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div>
              <p className="text-slate-200 font-medium">Show measurable outcomes</p>
              <p className="text-slate-400 text-sm">Define clear, quantifiable results and how you'll track progress.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <div>
              <p className="text-slate-200 font-medium">Build relationships</p>
              <p className="text-slate-400 text-sm">Consider reaching out to program officers before applying to discuss fit.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!funder.applicationProcess && !funder.applicationDeadline && !contactInfo && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No application information available
          </h3>
          <p className="text-slate-400">
            Add application details to help your team prepare submissions.
          </p>
        </div>
      )}
    </div>
  )
}

function YourHistoryTab({ grants }: { grants: any[] }) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState<Array<{ id: string; text: string; date: Date }>>([])

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([
        {
          id: Date.now().toString(),
          text: newNote.trim(),
          date: new Date(),
        },
        ...notes,
      ])
      setNewNote('')
      setIsAddingNote(false)
    }
  }

  if (!grants || grants.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No grant history</h3>
          <p className="text-slate-400">
            Your applications and awards from this funder will appear here.
          </p>
        </div>

        {/* Relationship Notes */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Relationship Notes</h2>
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>

          {isAddingNote && (
            <div className="mb-4 p-4 bg-slate-900 border border-slate-600 rounded-lg">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add notes about conversations, relationship updates, or future opportunities..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Note
                </button>
                <button
                  onClick={() => {
                    setIsAddingNote(false)
                    setNewNote('')
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-slate-300">{note.text}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {note.date.toLocaleDateString()} at {note.date.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isAddingNote && (
              <p className="text-slate-400 text-center py-8">
                No notes yet. Add notes to track your relationship with this funder.
              </p>
            )
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Your Grants ({grants.length})
        </h2>

        <div className="space-y-4">
          {grants.map(grant => (
            <div
              key={grant.id}
              className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        grant.status === 'AWARDED'
                          ? 'bg-emerald-900/30 text-emerald-300'
                          : grant.status === 'SUBMITTED'
                          ? 'bg-blue-900/30 text-blue-300'
                          : grant.status === 'DECLINED'
                          ? 'bg-red-900/30 text-red-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {grant.status}
                    </span>
                    {grant.program && (
                      <span className="text-sm text-slate-400">{grant.program.name}</span>
                    )}
                  </div>
                  {grant.deadline && (
                    <div className="text-sm text-slate-400">
                      Deadline: {new Date(grant.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {grant.amountAwarded && (
                    <div className="text-lg font-bold text-emerald-400">
                      ${Number(grant.amountAwarded).toLocaleString()}
                    </div>
                  )}
                  {grant.amountRequested && !grant.amountAwarded && (
                    <div className="text-lg font-bold text-blue-400">
                      ${Number(grant.amountRequested).toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    {grant.amountAwarded ? 'Awarded' : 'Requested'}
                  </div>
                </div>
              </div>

              {grant.notes && (
                <p className="text-sm text-slate-400 line-clamp-2">{grant.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Notes */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Relationship Notes</h2>
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>

        {isAddingNote && (
          <div className="mb-4 p-4 bg-slate-900 border border-slate-600 rounded-lg">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add notes about conversations, relationship updates, or future opportunities..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setIsAddingNote(false)
                  setNewNote('')
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-start gap-3">
                  <StickyNote className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-slate-300">{note.text}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {note.date.toLocaleDateString()} at {note.date.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isAddingNote && (
            <p className="text-slate-400 text-center py-8">
              No notes yet. Add notes to track your relationship with this funder.
            </p>
          )
        )}
      </div>
    </div>
  )
}
