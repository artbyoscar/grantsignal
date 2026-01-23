import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border h-[18px] px-1.5 py-0.5 text-[10px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)] [a&]:hover:bg-emerald-500/30 transition-all",
        warning:
          "border-transparent bg-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)] [a&]:hover:bg-amber-500/30 transition-all",
        danger:
          "border-transparent bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)] [a&]:hover:bg-red-500/30 transition-all",
        info:
          "border-transparent bg-blue-500/20 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)] [a&]:hover:bg-blue-500/30 transition-all",
        pending:
          "border-transparent bg-cyan-500/20 text-cyan-400 [a&]:hover:bg-cyan-500/30 transition-all",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// Deadline Badge Component with urgency styling
interface DeadlineBadgeProps extends React.ComponentProps<"span"> {
  deadline: Date | string
  className?: string
}

function DeadlineBadge({ deadline, className, children, ...props }: DeadlineBadgeProps) {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Determine urgency level
  const isOverdue = daysUntilDeadline < 0
  const isDueSoon = daysUntilDeadline >= 0 && daysUntilDeadline <= 3
  const isDueWithinWeek = daysUntilDeadline > 3 && daysUntilDeadline <= 7

  // Styles based on urgency
  const urgencyStyles = isOverdue
    ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse"
    : isDueSoon
    ? "border-transparent bg-background text-red-400 [&>svg]:text-red-400"
    : isDueWithinWeek
    ? "border-transparent bg-background text-amber-400"
    : "border-transparent bg-background text-muted-foreground"

  return (
    <span
      data-slot="deadline-badge"
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-all",
        urgencyStyles,
        className
      )}
      {...props}
    >
      {(isOverdue || isDueSoon) && <AlertCircle className="size-3" />}
      {children}
    </span>
  )
}

// Pill-style number badge (e.g., "45 Days Left")
interface PillBadgeProps extends React.ComponentProps<"span"> {
  status?: "success" | "warning" | "danger" | "info" | "pending" | "default"
  className?: string
}

function PillBadge({ status = "default", className, children, ...props }: PillBadgeProps) {
  const statusStyles = {
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
    danger: "bg-red-500/20 text-red-400",
    info: "bg-blue-500/20 text-blue-400",
    pending: "bg-cyan-500/20 text-cyan-400",
    default: "bg-primary/20 text-primary",
  }

  return (
    <span
      data-slot="pill-badge"
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium w-fit whitespace-nowrap transition-all",
        statusStyles[status],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge, badgeVariants, DeadlineBadge, PillBadge }
