'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UrgentAction {
  id: string;
  grantName: string;
  grantId: string;
  funderName: string;
  daysRemaining: number;
  severity: 'critical' | 'warning';
  actionType: string;
}

interface UrgentActionsPanelProps {
  actions?: UrgentAction[];
  className?: string;
}

export function UrgentActionsPanel({ actions = [], className }: UrgentActionsPanelProps) {
  const hasCritical = actions.some(action => action.severity === 'critical');
  const isEmpty = actions.length === 0;

  const getDaysRemainingColor = (days: number) => {
    if (days <= 3) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (days <= 7) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border border-slate-700/50 bg-slate-800/60 p-6',
        'transition-all duration-300',
        className
      )}
      style={{
        borderLeft: `3px solid ${hasCritical ? '#ef4444' : '#f59e0b'}`,
      }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Urgent Actions</h3>
          {!isEmpty && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500/20 px-2 text-xs font-bold text-amber-400 border border-amber-500/50">
              {actions.length}
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-4">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl" />

            {/* Icon */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>

          <h4 className="mb-2 text-lg font-semibold text-white">All caught up!</h4>
          <p className="text-sm text-slate-400">
            No urgent actions required at this time.
          </p>
        </div>
      ) : (
        /* Action Items List */
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className={cn(
                'group flex items-center justify-between gap-4 rounded-lg border p-4',
                'transition-all duration-200',
                'hover:bg-slate-700/30',
                action.severity === 'critical'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-amber-500/30 bg-amber-500/5'
              )}
            >
              {/* Left Content */}
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 pt-0.5">
                  {action.severity === 'critical' ? (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  )}
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/grants/${action.grantId}`}
                    className="block truncate text-sm font-medium text-blue-400 hover:underline"
                  >
                    {action.grantName}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {action.funderName}
                  </p>
                </div>

                {/* Days Remaining Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                      getDaysRemainingColor(action.daysRemaining)
                    )}
                  >
                    {action.daysRemaining === 0
                      ? 'Due today'
                      : action.daysRemaining === 1
                      ? '1 day'
                      : `${action.daysRemaining} days`}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/grants/${action.grantId}`}
                className={cn(
                  'flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium',
                  'transition-all duration-200',
                  'border',
                  action.severity === 'critical'
                    ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                )}
              >
                <span className="flex items-center gap-1">
                  Take Action
                  <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* View All Link (only if there are actions) */}
      {!isEmpty && (
        <div className="mt-4 flex justify-center">
          <Link
            href="/grants?filter=urgent"
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
          >
            View all urgent actions →
          </Link>
        </div>
      )}
    </div>
  );
}
