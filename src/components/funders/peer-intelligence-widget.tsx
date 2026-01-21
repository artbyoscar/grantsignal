'use client'

import { Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PeerIntelligenceWidgetProps {
  funderId: string
  funderName: string
  peerData: {
    peers: Array<{
      recipientName: string
      recipientEin?: string
      totalReceived: number
      grantCount: number
      latestYear: number
      latestAmount: number
      purposes: string[]
    }>
    averageGrant: number
    totalGrants: number
    years: number[]
  }
  className?: string
  showTitle?: boolean
  maxPeers?: number
}

export function PeerIntelligenceWidget({
  funderId,
  funderName,
  peerData,
  className = '',
  showTitle = true,
  maxPeers = 5,
}: PeerIntelligenceWidgetProps) {
  if (!peerData || peerData.peers.length === 0) {
    return null
  }

  return (
    <div
      className={`bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-6 ${className}`}
    >
      {showTitle && (
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Peer Intelligence</h3>
        </div>
      )}

      <p className="text-slate-300 mb-4">
        Organizations similar to yours that received grants from{' '}
        <Link
          href={`/opportunities/funders/${funderId}`}
          className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          {funderName}
        </Link>
      </p>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Average Grant</div>
          <div className="text-2xl font-bold text-emerald-400">
            ${Math.round(peerData.averageGrant).toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Total Grants Tracked</div>
          <div className="text-2xl font-bold text-blue-400">
            {peerData.totalGrants}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Years of Data</div>
          <div className="text-2xl font-bold text-purple-400">
            {peerData.years.length}
          </div>
        </div>
      </div>

      {/* Success Patterns */}
      <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="font-medium text-white">Success Patterns</h4>
        </div>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>
              {peerData.peers.filter(p => p.grantCount > 1).length} organizations received
              multiple grants
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>
              Average grant relationship spans{' '}
              {Math.round(
                peerData.peers.reduce((sum, p) => sum + p.grantCount, 0) /
                  peerData.peers.length
              )}{' '}
              awards
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>
              Most recent grants: {Math.max(...peerData.peers.map(p => p.latestYear))}
            </span>
          </li>
        </ul>
      </div>

      {/* Top Recipients */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">Top Recipients</h4>
          <Link
            href={`/opportunities/funders/${funderId}?tab=past-grantees`}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        {peerData.peers.slice(0, maxPeers).map((peer, idx) => (
          <div
            key={idx}
            className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
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
                <div className="text-xs text-slate-400">total received</div>
              </div>
            </div>

            {peer.purposes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">Grant purposes:</div>
                <div className="flex flex-wrap gap-1">
                  {peer.purposes.slice(0, 3).map((purpose, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded"
                    >
                      {purpose.length > 40 ? purpose.substring(0, 40) + '...' : purpose}
                    </span>
                  ))}
                  {peer.purposes.length > 3 && (
                    <span className="text-xs px-2 py-1 text-slate-500">
                      +{peer.purposes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-sm text-blue-200">
          💡 <strong>Pro tip:</strong> Review these organizations' publicly available
          materials to understand what this funder values in successful applications.
        </p>
      </div>
    </div>
  )
}

// Compact version for cards/sidebars
export function PeerIntelligenceCard({
  funderId,
  funderName,
  averageGrant,
  totalGrants,
  className = '',
}: {
  funderId: string
  funderName: string
  averageGrant: number
  totalGrants: number
  className?: string
}) {
  return (
    <Link
      href={`/opportunities/funders/${funderId}`}
      className={`block bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-4 hover:border-blue-600 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Users className="w-5 h-5 text-blue-400" />
        <h4 className="font-medium text-white">Peer Intelligence</h4>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-slate-400 text-xs mb-1">Similar orgs funded by</div>
          <div className="text-white font-medium">{funderName}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
          <div>
            <div className="text-slate-400 text-xs mb-1">Avg Grant</div>
            <div className="text-emerald-400 font-bold">
              ${Math.round(averageGrant).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Total Grants</div>
            <div className="text-blue-400 font-bold">{totalGrants}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-blue-400 flex items-center gap-1">
        View details
        <svg
          className="w-4 h-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
