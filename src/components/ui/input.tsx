import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Accessible Input Component
 *
 * Accessibility Features:
 * - Supports aria-invalid for error states (visual + semantic)
 * - Supports aria-describedby for linking to error/description text
 * - Supports aria-required for required fields
 * - Enhanced focus-visible ring for keyboard navigation
 *
 * Usage:
 * <Input
 *   id="email-input"
 *   aria-invalid={!!errors.email}
 *   aria-describedby="email-error"
 *   aria-required={true}
 * />
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[13px] text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          // Error state styling when aria-invalid is true
          "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
