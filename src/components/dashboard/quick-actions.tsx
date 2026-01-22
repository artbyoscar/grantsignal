import Link from "next/link";
import { Plus, Sparkles, Calendar, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  href: string;
  primary?: boolean;
}

const actions: QuickAction[] = [
  {
    icon: Plus,
    label: "New Grant",
    href: "/pipeline?new=true",
    primary: true,
  },
  {
    icon: Sparkles,
    label: "Add Opportunity",
    href: "/opportunities?add=true",
  },
  {
    icon: Calendar,
    label: "Schedule Meeting",
    href: "/calendar?new=true",
  },
  {
    icon: Upload,
    label: "Upload Document",
    href: "/documents?upload=true",
  },
];

export function QuickActionsPanel() {
  return (
    <Card className="p-4">
      {/* Header */}
      <h2 className="text-base font-semibold text-slate-100 mb-4">
        Quick Actions
      </h2>

      {/* Action buttons */}
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isPrimary = action.primary;

          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isPrimary
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
