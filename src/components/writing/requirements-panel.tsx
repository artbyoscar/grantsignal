'use client'

import { FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface OpportunityRequirement {
  section: string
  description: string
  wordLimit?: number
  required: boolean
  order: number
}

export interface RequirementsPanelProps {
  requirements: OpportunityRequirement[]
  opportunityTitle?: string
  deadline?: Date
  fundingRange?: { min?: number; max?: number }
}

export function RequirementsPanel({
  requirements,
  opportunityTitle,
  deadline,
  fundingRange,
}: RequirementsPanelProps) {
  const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order)

  const formatCurrency = (amount?: number) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {opportunityTitle && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium mb-1">
                {opportunityTitle}
              </h3>
              <div className="space-y-1">
                {deadline && (
                  <p className="text-sm text-slate-400">
                    Due:{' '}
                    {formatDistanceToNow(new Date(deadline), {
                      addSuffix: true,
                    })}
                  </p>
                )}
                {(fundingRange?.min || fundingRange?.max) && (
                  <p className="text-sm text-slate-400">
                    Amount: {formatCurrency(fundingRange.min)} -{' '}
                    {formatCurrency(fundingRange.max)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Requirements</h3>
        <div className="space-y-3">
          {sortedRequirements.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No specific requirements listed
            </p>
          ) : (
            sortedRequirements.map((req, idx) => (
              <div
                key={idx}
                className="pb-3 border-b border-slate-700 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-white">
                    {req.section}
                    {req.required && <span className="text-red-400 ml-1">*</span>}
                  </h4>
                  {req.wordLimit && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {req.wordLimit} words
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{req.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
