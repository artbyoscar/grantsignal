'use client'

import { useState } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface ComplianceWarning {
  type: 'metric_mismatch' | 'capacity_risk' | 'timeline_conflict' | 'duplicate_commitment'
  severity: 'info' | 'warning' | 'critical'
  message: string
  draftCommitment: string
  existingCommitment?: string
  existingGrant?: string
  existingFunder?: string
}

interface ComplianceResult {
  commitments: Array<{
    type: string
    description: string
    metricName: string | null
    metricValue: string | null
    dueDate: string | null
    confidence: number
    sourceText: string
  }>
  warnings: ComplianceWarning[]
  summary: {
    commitmentsFound: number
    existingCommitmentsChecked: number
    criticalIssues: number
    warnings: number
    informational: number
    overallStatus: 'critical' | 'warning' | 'clean'
    message: string
  }
}

interface ComplianceMonitorProps {
  grantId: string
  sectionName: string
  result: ComplianceResult | null
  isChecking: boolean
  onCheck: () => void
  className?: string
}

export function ComplianceMonitor({
  grantId,
  sectionName,
  result,
  isChecking,
  onCheck,
  className = '',
}: ComplianceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCommitments, setShowCommitments] = useState(false)

  const statusIcon = !result ? (
    <Shield className="w-4 h-4 text-slate-400" />
  ) : result.summary.overallStatus === 'clean' ? (
    <ShieldCheck className="w-4 h-4 text-emerald-400" />
  ) : result.summary.overallStatus === 'warning' ? (
    <ShieldAlert className="w-4 h-4 text-amber-400" />
  ) : (
    <ShieldAlert className="w-4 h-4 text-red-400" />
  )

  const statusColor = !result
    ? 'border-slate-700'
    : result.summary.overallStatus === 'clean'
      ? 'border-emerald-700/50'
      : result.summary.overallStatus === 'warning'
        ? 'border-amber-700/50'
        : 'border-red-700/50'

  const statusBg = !result
    ? 'bg-slate-800/50'
    : result.summary.overallStatus === 'clean'
      ? 'bg-emerald-900/10'
      : result.summary.overallStatus === 'warning'
        ? 'bg-amber-900/10'
        : 'bg-red-900/10'

  return (
    <div className={`${statusBg} border ${statusColor} rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-white hover:text-blue-300 transition-colors"
        >
          {statusIcon}
          <span>Compliance Monitor</span>
          {result && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              result.summary.overallStatus === 'clean'
                ? 'bg-emerald-800/50 text-emerald-300'
                : result.summary.overallStatus === 'warning'
                  ? 'bg-amber-800/50 text-amber-300'
                  : 'bg-red-800/50 text-red-300'
            }`}>
              {result.summary.overallStatus === 'clean'
                ? 'Clean'
                : `${result.summary.criticalIssues + result.summary.warnings} issues`
              }
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          )}
        </button>

        <button
          onClick={onCheck}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Shield className="w-3 h-3" />
              Check Now
            </>
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Summary */}
          {result ? (
            <>
              <p className="text-sm text-slate-300">{result.summary.message}</p>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  {result.warnings.map((warning, idx) => (
                    <WarningCard key={idx} warning={warning} />
                  ))}
                </div>
              )}

              {/* Detected Commitments */}
              {result.commitments.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCommitments(!showCommitments)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showCommitments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {result.commitments.length} commitment{result.commitments.length !== 1 ? 's' : ''} detected in this section
                  </button>

                  {showCommitments && (
                    <div className="mt-2 space-y-1.5">
                      {result.commitments.map((c, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs bg-slate-900/50 rounded p-2">
                          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                            c.confidence >= 80 ? 'bg-emerald-800/50 text-emerald-300'
                              : c.confidence >= 60 ? 'bg-amber-800/50 text-amber-300'
                                : 'bg-slate-700 text-slate-400'
                          }`}>
                            {c.type.replace('_', ' ')}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-300">{c.description}</p>
                            {c.metricName && c.metricValue && (
                              <p className="text-slate-500 mt-0.5">
                                {c.metricName}: {c.metricValue}
                              </p>
                            )}
                          </div>
                          <span className="text-slate-500">{c.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stats Bar */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50 text-xs text-slate-500">
                <span>{result.summary.commitmentsFound} found</span>
                <span>{result.summary.existingCommitmentsChecked} cross-checked</span>
                {result.summary.criticalIssues > 0 && (
                  <span className="text-red-400">{result.summary.criticalIssues} critical</span>
                )}
                {result.summary.warnings > 0 && (
                  <span className="text-amber-400">{result.summary.warnings} warnings</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-400">
                Click "Check Now" to analyze your draft for compliance issues.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Detects metric mismatches, capacity risks, and timeline conflicts across all your active grants.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WarningCard({ warning }: { warning: ComplianceWarning }) {
  const [expanded, setExpanded] = useState(false)

  const icon = warning.severity === 'critical' ? (
    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
  ) : warning.severity === 'warning' ? (
    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
  ) : (
    <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
  )

  const borderColor = warning.severity === 'critical'
    ? 'border-red-700/50'
    : warning.severity === 'warning'
      ? 'border-amber-700/50'
      : 'border-blue-700/50'

  return (
    <div className={`border ${borderColor} rounded-lg p-3`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 text-left"
      >
        {icon}
        <div className="flex-1">
          <p className="text-sm text-slate-200">{warning.message}</p>
        </div>
      </button>

      {expanded && (
        <div className="mt-2 ml-6 space-y-2 text-xs">
          <div className="bg-slate-900/50 rounded p-2">
            <span className="text-slate-500">In this draft: </span>
            <span className="text-slate-300">{warning.draftCommitment}</span>
          </div>
          {warning.existingCommitment && (
            <div className="bg-slate-900/50 rounded p-2">
              <span className="text-slate-500">Existing commitment: </span>
              <span className="text-slate-300">{warning.existingCommitment}</span>
              {warning.existingFunder && (
                <span className="text-slate-500"> (to {warning.existingFunder})</span>
              )}
            </div>
          )}
          {warning.existingGrant && (
            <Link
              href={`/grants/${warning.existingGrant}`}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              View related grant <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact compliance status badge for the editor toolbar
 */
export function ComplianceStatusBadge({
  status,
  onClick,
}: {
  status: 'unchecked' | 'clean' | 'warning' | 'critical' | 'checking'
  onClick: () => void
}) {
  const config = {
    unchecked: { icon: Shield, color: 'text-slate-400 bg-slate-800', label: 'Unchecked' },
    clean: { icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-900/30', label: 'Clean' },
    warning: { icon: ShieldAlert, color: 'text-amber-400 bg-amber-900/30', label: 'Warnings' },
    critical: { icon: ShieldAlert, color: 'text-red-400 bg-red-900/30', label: 'Issues' },
    checking: { icon: Loader2, color: 'text-blue-400 bg-blue-900/30', label: 'Checking' },
  }

  const { icon: Icon, color, label } = config[status]

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${color} hover:opacity-80 transition-opacity`}
      title={`Compliance: ${label}`}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
      {label}
    </button>
  )
}
