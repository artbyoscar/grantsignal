'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Calendar,
  Globe,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Award,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface AlignmentFactor {
  factor: string
  score: number
  maxScore: number
  description: string
}

interface FunderIntelligenceProfileProps {
  profile: {
    funder: {
      id: string
      name: string
      type: string
      ein?: string | null
      mission?: string | null
      website?: string | null
      city?: string | null
      state?: string | null
      nteeCode?: string | null
      applicationProcess?: string | null
      applicationDeadline?: string | null
      contactInfo?: any
      lastSyncedAt?: Date | null
    }
    alignment: {
      score: number
      maxScore: number
      level: 'strong' | 'moderate' | 'developing'
      factors: AlignmentFactor[]
    }
    giving: {
      totalAssets: number | null
      totalGiving: number | null
      grantSizeStats: {
        min: number
        max: number
        median: number
        average: number
        p25: number
        p75: number
      } | null
      trend: Array<{
        year: number
        grantCount: number
        totalGiving: number
        averageGrant: number
      }>
      growthRate: number | null
    }
    programFocus: {
      funderAreas: string[]
      orgAreas: string[]
      overlappingAreas: string[]
      topPurposeKeywords: Array<{ word: string; count: number }>
    }
    relationship: {
      totalGrantsReceived: number
      totalFunding: number
      latestGrant: any
      activeGrants: number
      requirementsMet: number
      requirementsTotal: number
    }
    opportunities: Array<{
      id: string
      title: string
      deadline: Date | null
      amountRange: string | null
    }>
    recommendations: string[]
  }
  onSync990?: () => void
  isSyncing?: boolean
}

export function FunderIntelligenceProfile({
  profile,
  onSync990,
  isSyncing,
}: FunderIntelligenceProfileProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('alignment')

  const { funder, alignment, giving, programFocus, relationship, opportunities, recommendations } = profile

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const alignmentColor = alignment.level === 'strong'
    ? 'text-emerald-400'
    : alignment.level === 'moderate'
      ? 'text-amber-400'
      : 'text-red-400'

  const alignmentBg = alignment.level === 'strong'
    ? 'from-emerald-900/20 to-emerald-800/10 border-emerald-700/50'
    : alignment.level === 'moderate'
      ? 'from-amber-900/20 to-amber-800/10 border-amber-700/50'
      : 'from-red-900/20 to-red-800/10 border-red-700/50'

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{funder.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-slate-400 text-sm">
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs uppercase">{funder.type.replace('_', ' ')}</span>
              {funder.ein && <span>EIN: {funder.ein}</span>}
              {funder.city && funder.state && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {funder.city}, {funder.state}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {funder.website && (
              <a
                href={funder.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Website
              </a>
            )}
            {onSync990 && funder.ein && (
              <button
                onClick={onSync990}
                disabled={isSyncing}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync 990
              </button>
            )}
          </div>
        </div>
        {funder.mission && (
          <p className="text-slate-300 text-sm leading-relaxed">{funder.mission}</p>
        )}
      </div>

      {/* Alignment Score Hero */}
      <div className={`bg-gradient-to-br ${alignmentBg} border rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Alignment Score</h3>
            </div>
            <p className="text-slate-400 text-sm">
              How well this funder matches your organization
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${alignmentColor}`}>
              {alignment.score}
              <span className="text-lg text-slate-500">/{alignment.maxScore}</span>
            </div>
            <div className={`text-sm font-medium capitalize ${alignmentColor}`}>
              {alignment.level} Match
            </div>
          </div>
        </div>

        {/* Alignment Factor Bars */}
        <div className="mt-6 space-y-3">
          {alignment.factors.map((factor) => (
            <div key={factor.factor}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">{factor.factor}</span>
                <span className="text-slate-400">{factor.score}/{factor.maxScore}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    factor.score / factor.maxScore >= 0.7
                      ? 'bg-emerald-500'
                      : factor.score / factor.maxScore >= 0.4
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Giving Analytics */}
      <CollapsibleSection
        title="Giving Analytics"
        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        isOpen={expandedSection === 'giving'}
        onToggle={() => toggleSection('giving')}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Assets"
            value={giving.totalAssets ? `$${formatCompact(giving.totalAssets)}` : 'N/A'}
          />
          <StatCard
            label="Total Giving"
            value={giving.totalGiving ? `$${formatCompact(giving.totalGiving)}` : 'N/A'}
          />
          <StatCard
            label="Avg Grant"
            value={giving.grantSizeStats ? `$${formatCompact(giving.grantSizeStats.average)}` : 'N/A'}
          />
          <StatCard
            label="Growth Rate"
            value={giving.growthRate !== null ? `${giving.growthRate > 0 ? '+' : ''}${giving.growthRate}%` : 'N/A'}
            icon={giving.growthRate !== null && giving.growthRate > 0
              ? <TrendingUp className="w-4 h-4 text-emerald-400" />
              : giving.growthRate !== null && giving.growthRate < 0
                ? <TrendingDown className="w-4 h-4 text-red-400" />
                : undefined
            }
          />
        </div>

        {giving.grantSizeStats && (
          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-white mb-3">Grant Size Distribution</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">${formatCompact(giving.grantSizeStats.min)}</span>
              <div className="flex-1 relative h-6">
                <div className="absolute inset-0 bg-slate-800 rounded-full" />
                <div
                  className="absolute top-0 h-full bg-blue-600/30 rounded-full"
                  style={{
                    left: `${((giving.grantSizeStats.p25 - giving.grantSizeStats.min) / (giving.grantSizeStats.max - giving.grantSizeStats.min)) * 100}%`,
                    width: `${((giving.grantSizeStats.p75 - giving.grantSizeStats.p25) / (giving.grantSizeStats.max - giving.grantSizeStats.min)) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 w-1 h-full bg-emerald-400 rounded"
                  style={{
                    left: `${((giving.grantSizeStats.median - giving.grantSizeStats.min) / (giving.grantSizeStats.max - giving.grantSizeStats.min)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-500">${formatCompact(giving.grantSizeStats.max)}</span>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>25th: ${formatCompact(giving.grantSizeStats.p25)}</span>
              <span className="text-emerald-400">Median: ${formatCompact(giving.grantSizeStats.median)}</span>
              <span>75th: ${formatCompact(giving.grantSizeStats.p75)}</span>
            </div>
          </div>
        )}

        {giving.trend.length > 0 && (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3">Year-over-Year Giving</h4>
            <div className="space-y-2">
              {giving.trend.slice(-5).map((year) => (
                <div key={year.year} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-12">{year.year}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-3">
                        <div
                          className="h-3 bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (year.totalGiving / Math.max(...giving.trend.map(t => t.totalGiving))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-20 text-right">
                        ${formatCompact(year.totalGiving)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right">
                    {year.grantCount} grants
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Program Focus */}
      <CollapsibleSection
        title="Program Focus"
        icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
        isOpen={expandedSection === 'program'}
        onToggle={() => toggleSection('program')}
      >
        {programFocus.overlappingAreas.length > 0 && (
          <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-emerald-400 mb-2">Shared Focus Areas</h4>
            <div className="flex flex-wrap gap-2">
              {programFocus.overlappingAreas.map((area) => (
                <span key={area} className="px-3 py-1 bg-emerald-800/40 text-emerald-300 text-sm rounded-full">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Funder Focus Areas</h4>
            <div className="flex flex-wrap gap-1.5">
              {programFocus.funderAreas.length > 0 ? programFocus.funderAreas.map((area) => (
                <span key={area} className={`px-2 py-1 text-xs rounded ${
                  programFocus.overlappingAreas.includes(area)
                    ? 'bg-emerald-800/40 text-emerald-300'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {area}
                </span>
              )) : (
                <span className="text-xs text-slate-500">No focus areas on record</span>
              )}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-400 mb-2">Your Program Areas</h4>
            <div className="flex flex-wrap gap-1.5">
              {programFocus.orgAreas.length > 0 ? programFocus.orgAreas.map((area) => (
                <span key={area} className={`px-2 py-1 text-xs rounded ${
                  programFocus.overlappingAreas.includes(area)
                    ? 'bg-emerald-800/40 text-emerald-300'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {area}
                </span>
              )) : (
                <span className="text-xs text-slate-500">No program areas set</span>
              )}
            </div>
          </div>
        </div>

        {programFocus.topPurposeKeywords.length > 0 && (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3">Top Grant Purpose Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {programFocus.topPurposeKeywords.map(({ word, count }) => (
                <span
                  key={word}
                  className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                  title={`Appeared in ${count} grants`}
                >
                  {word} ({count})
                </span>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Relationship History */}
      <CollapsibleSection
        title="Your Relationship"
        icon={<Award className="w-5 h-5 text-amber-400" />}
        isOpen={expandedSection === 'relationship'}
        onToggle={() => toggleSection('relationship')}
      >
        {relationship.totalGrantsReceived > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Grants Received" value={String(relationship.totalGrantsReceived)} />
              <StatCard label="Total Funding" value={`$${formatCompact(relationship.totalFunding)}`} />
              <StatCard label="Active Grants" value={String(relationship.activeGrants)} />
              <StatCard
                label="Requirements Met"
                value={relationship.requirementsTotal > 0
                  ? `${relationship.requirementsMet}/${relationship.requirementsTotal}`
                  : 'N/A'
                }
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No prior grants from this funder.</p>
            <p className="text-xs text-slate-500 mt-1">
              This would be a new funder relationship.
            </p>
          </div>
        )}
      </CollapsibleSection>

      {/* Open Opportunities */}
      {opportunities.length > 0 && (
        <CollapsibleSection
          title={`Open Opportunities (${opportunities.length})`}
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          isOpen={expandedSection === 'opportunities'}
          onToggle={() => toggleSection('opportunities')}
        >
          <div className="space-y-2">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
              >
                <div>
                  <div className="text-white font-medium text-sm">{opp.title}</div>
                  {opp.amountRange && (
                    <div className="text-xs text-slate-400 mt-0.5">{opp.amountRange}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {opp.deadline && (
                    <span className="text-xs text-slate-400">
                      Due: {new Date(opp.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Strategic Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Strategic Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center text-xs text-blue-300 font-medium">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Helper Components ---

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3">
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-bold text-white">{value}</span>
        {icon}
      </div>
    </div>
  )
}

function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return num.toLocaleString()
}
