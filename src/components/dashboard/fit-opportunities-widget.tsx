'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Target,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function FitOpportunitiesWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data, isLoading, error, refetch } = api.discovery.getRecommendedOpportunities.useQuery({
    limit: 5,
    minScore: 60,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Fit scores refreshed', {
        description: 'All opportunity fit scores have been recalculated.',
      })
    } catch (err) {
      toast.error('Refresh failed', {
        description: 'Failed to refresh fit scores. Please try again.',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    if (score >= 70) return 'text-blue-500 border-blue-500/30 bg-blue-500/10'
    if (score >= 60) return 'text-amber-500 border-amber-500/30 bg-amber-500/10'
    return 'text-red-500 border-red-500/30 bg-red-500/10'
  }

  const getUrgencyColor = (deadline: Date | null) => {
    if (!deadline) return 'text-slate-400'
    const now = new Date()
    const daysUntil = Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil <= 7) return 'text-red-400'
    if (daysUntil <= 14) return 'text-amber-400'
    return 'text-slate-400'
  }

  const formatDeadline = (deadline: Date | null) => {
    if (!deadline) return 'No deadline'
    const now = new Date()
    const daysUntil = Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return 'Expired'
    if (daysUntil === 0) return 'Due today'
    if (daysUntil === 1) return 'Due tomorrow'
    if (daysUntil <= 7) return `${daysUntil} days left`
    if (daysUntil <= 30) return `${daysUntil} days left`
    return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Opportunities for You
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-slate-300 font-medium">Failed to load opportunities</p>
          <p className="text-sm text-slate-500 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const opportunities = data || []

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Top Opportunities for You
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personalized recommendations based on your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
          <Link
            href="/opportunities?sort=fit"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-slate-900/50 rounded-full p-4 mb-4">
            <Sparkles className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium mb-2">No opportunities analyzed yet</p>
          <p className="text-sm text-slate-500 mb-4 max-w-xs">
            Import an RFP to see personalized recommendations based on your organization's profile
          </p>
          <Link href="/discovery">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Go to Smart Discovery
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map(({ opportunity, fitScore }) => {
            const scoreColor = getScoreColor(fitScore.overallScore)
            const deadlineColor = getUrgencyColor(opportunity.deadline)

            return (
              <div
                key={opportunity.id}
                className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-900/70 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Funder Logo/Initial */}
                  <div className="flex-shrink-0">
                    {opportunity.funder?.logoUrl ? (
                      <img
                        src={opportunity.funder.logoUrl}
                        alt={opportunity.funder.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                        <span className="text-lg font-semibold text-slate-300">
                          {opportunity.funder?.name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-1">
                          {opportunity.funder?.name || 'Unknown Funder'}
                        </p>
                        <h3 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                          {opportunity.title}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('font-semibold border whitespace-nowrap', scoreColor)}
                      >
                        {fitScore.overallScore} Fit
                      </Badge>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className={cn('flex items-center gap-1.5', deadlineColor)}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDeadline(opportunity.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{fitScore.estimatedHours}h estimated</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/opportunities/${opportunity.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full group-hover:border-blue-500 group-hover:text-blue-400 transition-colors"
                      >
                        Quick Apply
                        <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
