'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Calendar, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AddGrantModal, NewGrantData } from "@/components/pipeline/add-grant-modal";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export function QuickActionsPanel() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  const handleGrantSubmit = async (data: NewGrantData) => {
    // TODO: Create grant via tRPC
    console.log('Creating grant:', data);

    // Close modal and navigate to pipeline
    setIsAddModalOpen(false);
    router.push('/pipeline');
  };

  const actions: QuickAction[] = [
    {
      icon: Plus,
      label: "New Grant",
      onClick: () => setIsAddModalOpen(true),
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

  return (
    <>
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

            // Render button for actions with onClick
            if (action.onClick) {
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full",
                    isPrimary
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </button>
              );
            }

            // Render link for actions with href
            return (
              <Link
                key={action.label}
                href={action.href!}
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

      <AddGrantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleGrantSubmit}
      />
    </>
  );
}
