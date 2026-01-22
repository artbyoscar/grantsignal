import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface UrgentAction {
  id: string;
  type: "deadline" | "report" | "contract" | "review";
  title: string;
  grantName: string;
  funderName: string;
  daysRemaining: number; // negative means overdue
  actionLabel: string;
  actionHref: string;
}

interface UrgentActionsPanelProps {
  actions: UrgentAction[];
}

export function UrgentActionsPanel({ actions }: UrgentActionsPanelProps) {
  const hasActions = actions.length > 0;

  return (
    <Card className="border-l-4 border-l-amber-500 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-100 flex-1">
          Urgent Actions
        </h2>
        {hasActions && (
          <div className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full text-sm font-medium">
            {actions.length}
          </div>
        )}
      </div>

      {/* Content */}
      {hasActions ? (
        <div className="divide-y divide-slate-700/50">
          {actions.map((action) => {
            const isOverdue = action.daysRemaining < 0;
            const isDueToday = action.daysRemaining === 0;

            const dotColor = isOverdue
              ? "bg-red-500"
              : isDueToday
                ? "bg-amber-500"
                : "bg-amber-400";

            const badgeColor = isOverdue
              ? "bg-red-500/20 text-red-300 border-red-500/30"
              : isDueToday
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-amber-400/20 text-amber-200 border-amber-400/30";

            const daysText = isOverdue
              ? `${Math.abs(action.daysRemaining)}d overdue`
              : isDueToday
                ? "Due today"
                : `${action.daysRemaining}d remaining`;

            return (
              <div
                key={action.id}
                className="p-4 flex items-start gap-3 hover:bg-slate-800/30 transition-colors"
              >
                {/* Status dot */}
                <div className="flex-shrink-0 mt-1.5">
                  <div className={cn("h-2 w-2 rounded-full", dotColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-slate-100 leading-tight">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {action.grantName}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex-shrink-0 px-2 py-1 rounded text-xs font-medium border",
                        badgeColor
                      )}
                    >
                      {daysText}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <Link href={action.actionHref}>{action.actionLabel}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty state
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">
              All caught up!
            </h3>
            <p className="text-sm text-slate-400">
              No urgent actions at this time
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
