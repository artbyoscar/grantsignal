'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import {
  Shield, AlertTriangle, CheckCircle, Clock,
  ChevronRight, RefreshCw, Plus, Filter,
  AlertCircle, FileText, Calendar, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, differenceInDays } from 'date-fns';

// Health Score Card Component
function HealthScoreCard({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-emerald-400';
    if (s >= 70) return 'text-blue-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 85) return 'Excellent';
    if (s >= 70) return 'Good';
    if (s >= 50) return 'Needs Attention';
    return 'Critical';
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Compliance Health</h3>
        <Shield className="w-5 h-5 text-slate-400" />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48" cy="48" r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-700"
            />
            <circle
              cx="48" cy="48" r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 * (1 - score / 100)}
              className={getScoreColor(score)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
        </div>
        <div>
          <p className={`text-lg font-medium ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
          <p className="text-sm text-slate-400">
            Based on commitments and conflicts
          </p>
        </div>
      </div>
    </div>
  );
}

// Stats Cards Component
function StatsCards({ summary }: { summary: any }) {
  const stats = [
    {
      label: 'Total Commitments',
      value: summary.totalCommitments,
      icon: FileText,
      color: 'text-blue-400'
    },
    {
      label: 'Pending',
      value: summary.pendingCommitments,
      icon: Clock,
      color: 'text-amber-400'
    },
    {
      label: 'Overdue',
      value: summary.overdueCommitments,
      icon: AlertTriangle,
      color: summary.overdueCommitments > 0 ? 'text-red-400' : 'text-slate-400'
    },
    {
      label: 'Conflicts',
      value: summary.unresolvedConflicts,
      icon: AlertCircle,
      color: summary.unresolvedConflicts > 0 ? 'text-red-400' : 'text-emerald-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">{stat.label}</span>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// Conflicts List Component
function ConflictsList({ conflicts, onResolve }: { conflicts: any[]; onResolve: (id: string) => void }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (conflicts.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Conflicts Detected</h3>
        <p className="text-slate-400">Your commitments are consistent across all grants.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conflicts.map((conflict) => (
        <div key={conflict.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(conflict.severity)}`}>
                {conflict.severity}
              </span>
              <span className="text-xs text-slate-500 uppercase">{conflict.conflictType.replace('_', ' ')}</span>
            </div>
            <button
              onClick={() => onResolve(conflict.id)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Resolve
            </button>
          </div>

          <p className="text-white mb-3">{conflict.description}</p>

          {conflict.suggestedResolution && (
            <div className="bg-slate-700/50 rounded p-3 mb-3">
              <p className="text-xs text-slate-400 mb-1">Suggested Resolution:</p>
              <p className="text-sm text-slate-300">{conflict.suggestedResolution}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Grant: {conflict.commitment?.grant?.funder?.name || 'Unknown'}</span>
            <span>Detected: {formatDistanceToNow(new Date(conflict.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Upcoming Commitments Component
function UpcomingCommitments({ commitments }: { commitments: any[] }) {
  const getUrgencyColor = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    if (days < 0) return 'text-red-400 bg-red-500/20';
    if (days <= 7) return 'text-amber-400 bg-amber-500/20';
    return 'text-slate-400 bg-slate-700';
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          Upcoming Commitments
        </h3>
      </div>

      {commitments.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-slate-400">No upcoming commitments in the next 30 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-700">
          {commitments.map((commitment) => (
            <div key={commitment.id} className="p-4 hover:bg-slate-700/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white font-medium">{commitment.description}</p>
                  <p className="text-sm text-slate-400">
                    {commitment.grant?.funder?.name || 'Unknown Funder'}
                  </p>
                </div>
                {commitment.dueDate && (
                  <span className={`px-2 py-1 text-xs rounded ${getUrgencyColor(new Date(commitment.dueDate))}`}>
                    {format(new Date(commitment.dueDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>

              {commitment.metricName && commitment.metricValue && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">{commitment.metricName}:</span>
                  <span className="text-white font-medium">{commitment.metricValue}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function CompliancePage() {
  const [showResolveModal, setShowResolveModal] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } =
    api.compliance.getSummary.useQuery();

  const { data: conflicts, isLoading: conflictsLoading, refetch: refetchConflicts } =
    api.compliance.listConflicts.useQuery({ status: 'UNRESOLVED' });

  const detectMutation = api.compliance.detectConflicts.useMutation({
    onSuccess: () => {
      refetchSummary();
      refetchConflicts();
    }
  });

  const handleRunDetection = () => {
    detectMutation.mutate();
  };

  const handleResolve = (conflictId: string) => {
    setShowResolveModal(conflictId);
  };

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Compliance Guardian</h1>
          <p className="text-slate-400 mt-1">Track commitments and detect conflicts across grants</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunDetection}
            disabled={detectMutation.isPending}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
            Run Detection
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Commitment
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {summary && summary.criticalConflicts > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">
              {summary.criticalConflicts} Critical Conflict{summary.criticalConflicts > 1 ? 's' : ''} Detected
            </p>
            <p className="text-red-300/80 text-sm">
              These conflicts could put your funding at risk. Review and resolve immediately.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {summary && <StatsCards summary={summary} />}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Health Score */}
        <div className="lg:col-span-1 space-y-6">
          {summary && <HealthScoreCard score={summary.healthScore} />}
          {summary && <UpcomingCommitments commitments={summary.upcomingCommitments} />}
        </div>

        {/* Right Column - Conflicts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Active Conflicts</h2>
            <button className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {conflictsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <ConflictsList
              conflicts={conflicts || []}
              onResolve={handleResolve}
            />
          )}
        </div>
      </div>
    </div>
  );
}
