'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import {
  Shield, AlertTriangle, CheckCircle, Clock, RefreshCw,
  Plus, Filter, Search, ChevronDown, Calendar, Building2,
  FileText, User, Activity
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, differenceInDays } from 'date-fns';
import { ResolveConflictModal } from '@/components/compliance/resolve-conflict-modal';
import { AddCommitmentModal } from '@/components/compliance/add-commitment-modal';
import { useUser } from '@clerk/nextjs';

const TYPE_LABELS: Record<string, string> = {
  DELIVERABLE: 'Deliverable',
  OUTCOME_METRIC: 'Outcome Metric',
  REPORT_DUE: 'Report Due',
  BUDGET_SPEND: 'Budget',
  STAFFING: 'Staffing',
  TIMELINE: 'Timeline'
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle }
};

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  CONFLICT_DETECTED: { label: 'Conflict Detected', icon: AlertTriangle, color: 'text-red-400' },
  CONFLICT_RESOLVED: { label: 'Conflict Resolved', icon: CheckCircle, color: 'text-emerald-400' },
  CONFLICT_IGNORED: { label: 'Conflict Ignored', icon: AlertTriangle, color: 'text-slate-400' },
  COMMITMENT_UPDATED: { label: 'Commitment Updated', icon: FileText, color: 'text-blue-400' },
  SCAN_COMPLETED: { label: 'Scan Completed', icon: Activity, color: 'text-purple-400' }
};

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

// Commitment Registry Component (Left Column - 45%)
function CommitmentRegistry({ onAddClick }: { onAddClick: () => void }) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = api.compliance.listCommitments.useQuery({
    status: statusFilter as any,
    limit: 100
  });

  const filteredCommitments = data?.commitments.filter(c => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return c.description.toLowerCase().includes(searchLower) ||
             c.grant?.funder?.name?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const getEffectiveStatus = (commitment: any) => {
    if (commitment.status === 'PENDING' && commitment.dueDate && isPast(new Date(commitment.dueDate))) {
      return 'OVERDUE';
    }
    return commitment.status;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            Commitment Registry
          </h3>
          <button
            onClick={onAddClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search commitments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredCommitments?.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No commitments found</p>
            <p className="text-slate-500 text-xs mt-1">
              Extract commitments from grant documents or add manually
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-400">Commitment</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-400">Grant</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-400">Due</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCommitments?.map((commitment) => {
                const status = getEffectiveStatus(commitment);
                const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={commitment.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="text-white text-sm font-medium line-clamp-2">{commitment.description}</p>
                      <p className="text-xs text-slate-500">{TYPE_LABELS[commitment.type] || commitment.type}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 text-xs truncate">
                          {commitment.grant?.funder?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {commitment.dueDate ? (
                        <span className={`text-xs ${
                          isPast(new Date(commitment.dueDate)) ? 'text-red-400' :
                          differenceInDays(new Date(commitment.dueDate), new Date()) <= 14 ? 'text-amber-400' :
                          'text-slate-300'
                        }`}>
                          {format(new Date(commitment.dueDate), 'MMM d')}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Conflict Detection Component (Center Column - 30%)
function ConflictDetection({ onResolve }: { onResolve: (conflict: any) => void }) {
  const { data: conflicts, isLoading } = api.compliance.listConflicts.useQuery({ status: 'UNRESOLVED' });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-slate-400" />
          Conflict Detection
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {conflicts?.length || 0} unresolved conflict{conflicts?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-700 rounded animate-pulse" />
          ))
        ) : conflicts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
            <h4 className="text-white font-medium mb-1">No Conflicts Detected</h4>
            <p className="text-slate-400 text-sm">
              Your commitments are consistent across all grants
            </p>
          </div>
        ) : (
          conflicts?.map((conflict) => (
            <div key={conflict.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(conflict.severity)}`}>
                  {conflict.severity}
                </span>
                <button
                  onClick={() => onResolve(conflict)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Resolve
                </button>
              </div>

              <p className="text-white text-sm mb-2 line-clamp-2">{conflict.description}</p>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{conflict.commitment?.grant?.funder?.name || 'Unknown'}</span>
              </div>

              <div className="text-xs text-slate-500 mt-1">
                {formatDistanceToNow(new Date(conflict.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Audit Trail Component (Right Column - 25%)
function AuditTrail() {
  const { user } = useUser();
  const { data: auditLogs, isLoading } = api.compliance.getAuditTrail.useQuery({ limit: 20 });

  // Group logs by date
  const groupedLogs = auditLogs?.reduce((acc, log) => {
    const date = format(new Date(log.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, typeof auditLogs>);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          Audit Trail
        </h3>
        <p className="text-xs text-slate-500 mt-1">Recent compliance actions</p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !auditLogs || auditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Activity className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No audit logs yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLogs || {}).map(([date, logs]) => (
              <div key={date}>
                <div className="text-xs font-medium text-slate-400 mb-2 sticky top-0 bg-slate-800 py-1">
                  {format(new Date(date), 'MMM d, yyyy')}
                </div>
                <div className="space-y-3">
                  {logs.map((log) => {
                    const config = ACTION_TYPE_LABELS[log.actionType] || {
                      label: log.actionType,
                      icon: Activity,
                      color: 'text-slate-400'
                    };
                    const Icon = config.icon;

                    return (
                      <div key={log.id} className="flex gap-2.5 text-sm">
                        <div className={`w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs leading-relaxed">
                            {log.description}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {format(new Date(log.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page Component
export default function CompliancePage() {
  const [selectedConflict, setSelectedConflict] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } =
    api.compliance.getSummary.useQuery();

  const { refetch: refetchConflicts } = api.compliance.listConflicts.useQuery({ status: 'UNRESOLVED' });

  const utils = api.useUtils();

  const detectMutation = api.compliance.detectConflicts.useMutation({
    onSuccess: () => {
      refetchSummary();
      refetchConflicts();
    }
  });

  const handleResolveComplete = () => {
    refetchSummary();
    refetchConflicts();
    utils.compliance.getAuditTrail.invalidate();
  };

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-700 rounded w-48 animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          <div className="col-span-5 bg-slate-800 rounded-lg animate-pulse" />
          <div className="col-span-4 bg-slate-800 rounded-lg animate-pulse" />
          <div className="col-span-3 bg-slate-800 rounded-lg animate-pulse" />
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
        <button
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
          Run Detection
        </button>
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

      {/* Health Score */}
      {summary && <HealthScoreCard score={summary.healthScore} />}

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}>
        {/* Left Column - Commitment Registry (45%) */}
        <div className="col-span-5">
          <CommitmentRegistry onAddClick={() => setIsAddModalOpen(true)} />
        </div>

        {/* Center Column - Conflict Detection (30%) */}
        <div className="col-span-4">
          <ConflictDetection onResolve={setSelectedConflict} />
        </div>

        {/* Right Column - Audit Trail (25%) */}
        <div className="col-span-3">
          <AuditTrail />
        </div>
      </div>

      {/* Modals */}
      {selectedConflict && (
        <ResolveConflictModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onResolved={handleResolveComplete}
        />
      )}

      <AddCommitmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          utils.compliance.listCommitments.invalidate();
          utils.compliance.getSummary.invalidate();
        }}
      />
    </div>
  );
}
