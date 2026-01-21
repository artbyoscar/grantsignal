'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import {
  Building2,
  DollarSign,
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
} from 'lucide-react'

type Tab = 'overview' | 'giving-history' | 'past-grantees' | 'application' | 'your-history'

export default function FunderProfilePage() {
  const params = useParams()
  const funderId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Fetch funder data
  const { data: funder, isLoading, refetch } = trpc.funders.getById.useQuery({ funderId })
  const { data: givingHistory } = trpc.funders.getGivingHistory.useQuery({ funderId })
  const { data: peerIntel } = trpc.funders.getPeerIntelligence.useQuery({ funderId })

  // Sync mutation
  const syncMutation = trpc.funders.sync990.useMutation({
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">{funder.name}</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
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

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {funder.grantSizeMedian && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Median Grant Size</div>
                  <div className="text-2xl font-bold text-blue-400">
                    ${Number(funder.grantSizeMedian).toLocaleString()}
                  </div>
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

  return (
    <div className="space-y-6">
      {/* 5-Year Trend Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">5-Year Giving Trends</h2>
        <div className="space-y-4">
          {givingHistory.filings.slice(0, 5).map((filing: any, idx: number) => {
            const maxGiving = Math.max(
              ...givingHistory.filings.slice(0, 5).map((f: any) => f.totalGiving)
            )
            const percentage = (filing.totalGiving / maxGiving) * 100

            return (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-medium">{filing.year}</span>
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search recipients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={yearFilter || ''}
            onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)}
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
              {filteredGrantees.map((grantee, idx) => (
                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-white">{grantee.recipientName}</td>
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
              ))}
            </tbody>
          </table>
        </div>
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
  if (!grants || grants.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No grant history</h3>
        <p className="text-slate-400">
          Your applications and awards from this funder will appear here.
        </p>
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
    </div>
  )
}
