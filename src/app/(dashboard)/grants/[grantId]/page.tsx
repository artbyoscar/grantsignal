'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit3, Calendar, DollarSign, Building2, Target, FileText, Clock } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { AssigneeSelector } from '@/components/grants/assignee-selector'
import { GrantStatus } from '@prisma/client'

// Status badge colors
const STATUS_COLORS: Record<GrantStatus, string> = {
  PROSPECT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  RESEARCHING: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  WRITING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  SUBMITTED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  PENDING: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  AWARDED: 'bg-green-500/20 text-green-300 border-green-500/30',
  DECLINED: 'bg-red-500/20 text-red-300 border-red-500/30',
  ACTIVE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CLOSEOUT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  COMPLETED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

// Format currency
function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Calculate days remaining
function getDaysRemaining(deadline: Date | null | undefined): number | null {
  if (!deadline) return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function GrantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const grantId = params.grantId as string

  const { data: grant, isLoading } = api.grants.byId.useQuery(
    { id: grantId },
    { enabled: !!grantId }
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-700 rounded mb-4" />
          <div className="h-4 w-96 bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  if (!grant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold text-white mb-2">Grant not found</h2>
        <p className="text-slate-400 mb-6">The grant you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/pipeline')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Back to Pipeline
        </button>
      </div>
    )
  }

  const deadline = grant.opportunity?.deadline || grant.deadline
  const daysRemaining = getDaysRemaining(deadline)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Grant Details</h1>
          <p className="text-slate-400 mt-1">View and manage grant information</p>
        </div>
        <button
          onClick={() => router.push(`/write/${grant.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Open in Writer
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grant Overview Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {grant.funder?.name || 'Unknown Funder'}
                </h2>
                {grant.opportunity?.title && (
                  <p className="text-slate-300 text-lg">{grant.opportunity.title}</p>
                )}
              </div>
              <span
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${
                  STATUS_COLORS[grant.status]
                }`}
              >
                {grant.status}
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Amount Requested</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(grant.amountRequested)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Deadline</p>
                  {deadline ? (
                    <>
                      <p className="text-xl font-bold text-white">
                        {new Date(deadline).toLocaleDateString()}
                      </p>
                      {daysRemaining !== null && (
                        <p
                          className={`text-xs font-medium ${
                            daysRemaining < 0
                              ? 'text-red-400'
                              : daysRemaining < 7
                              ? 'text-red-400'
                              : daysRemaining <= 14
                              ? 'text-amber-400'
                              : 'text-green-400'
                          }`}
                        >
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days left`}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xl text-slate-500">No deadline set</p>
                  )}
                </div>
              </div>

              {grant.program && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Program</p>
                    <p className="text-lg font-medium text-white">{grant.program.name}</p>
                  </div>
                </div>
              )}

              {grant._count && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Documents</p>
                    <p className="text-lg font-medium text-white">{grant._count.documents}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Funder Information */}
          {grant.funder && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Funder Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Funder Name</p>
                  <p className="text-sm text-white">{grant.funder.name}</p>
                </div>
                {grant.funder.type && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Funder Type</p>
                    <p className="text-sm text-white">
                      {grant.funder.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Opportunity Information */}
          {grant.opportunity && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Opportunity Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Title</p>
                  <p className="text-sm text-white">{grant.opportunity.title}</p>
                </div>
                {grant.opportunity.fitScores?.[0] && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Fit Scores</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Overall</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {grant.opportunity.fitScores[0].overallScore}
                        </p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Mission</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {grant.opportunity.fitScores[0].missionScore}
                        </p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg">
                        <p className="text-xs text-slate-400">Capacity</p>
                        <p className="text-2xl font-bold text-green-400">
                          {grant.opportunity.fitScores[0].capacityScore}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Assignment & Metadata */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <AssigneeSelector
              grantId={grant.id}
              currentAssignee={grant.assignedTo}
              variant="full"
            />
          </div>

          {/* Metadata Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Timeline</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Created</p>
                <p className="text-sm text-white">
                  {new Date(grant.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                <p className="text-sm text-white">
                  {new Date(grant.updatedAt).toLocaleDateString()}
                </p>
              </div>
              {grant.submittedAt && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Submitted</p>
                  <p className="text-sm text-white">
                    {new Date(grant.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {grant.assignedAt && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Assigned</p>
                  <p className="text-sm text-white">
                    {new Date(grant.assignedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
