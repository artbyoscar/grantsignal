'use client';

import { api } from '@/lib/trpc/client';
import { Shield, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';

export function ComplianceWidget() {
  const { data: summary, isLoading } = api.compliance.getSummary.useQuery();

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-32 mb-4" />
        <div className="h-24 bg-slate-700 rounded" />
      </div>
    );
  }

  if (!summary) return null;

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-white">Compliance Status</h3>
        </div>
        <Link
          href="/compliance"
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="p-4">
        {/* Health Score */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400">Health Score</p>
            <p className={`text-3xl font-bold ${getHealthColor(summary.healthScore)}`}>
              {summary.healthScore}
            </p>
          </div>

          {summary.criticalConflicts > 0 ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {summary.criticalConflicts} Critical
                </span>
              </div>
            </div>
          ) : summary.unresolvedConflicts > 0 ? (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {summary.unresolvedConflicts} Conflict{summary.unresolvedConflicts > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">All Clear</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{summary.totalCommitments}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{summary.pendingCommitments}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${summary.overdueCommitments > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {summary.overdueCommitments}
            </p>
            <p className="text-xs text-slate-400">Overdue</p>
          </div>
        </div>

        {/* Upcoming Commitments Preview */}
        {summary.upcomingCommitments.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Next Due</p>
            <div className="space-y-2">
              {summary.upcomingCommitments.slice(0, 2).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate max-w-[180px]">{c.description}</span>
                  <span className={`text-xs ${
                    differenceInDays(new Date(c.dueDate), new Date()) <= 7
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}>
                    {format(new Date(c.dueDate), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
