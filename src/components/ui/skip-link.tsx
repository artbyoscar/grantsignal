"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
}

/**
 * Skip Link Component for Accessibility
 *
 * Provides a hidden link that becomes visible when focused, allowing keyboard users
 * to skip directly to the main content, bypassing navigation and other repeated elements.
 *
 * WCAG 2.1 Success Criterion 2.4.1 (Level A): Bypass Blocks
 *
 * @example
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 */
export function SkipLink({ href, children, className, ...props }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        "sr-only",
        // Visible when focused
        "focus:not-sr-only",
        "focus:fixed focus:top-4 focus:left-4 focus:z-50",
        // Styling when visible
        "focus:inline-block",
        "focus:px-6 focus:py-3",
        "focus:bg-blue-600 focus:text-white",
        "focus:rounded-lg focus:shadow-lg",
        "focus:ring-[3px] focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950",
        // Typography
        "focus:text-sm focus:font-semibold",
        // Animation
        "focus:transition-all focus:duration-150",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}
