import type { Grant } from "@prisma/client";

/**
 * Grant section structure from draftContent JSON field
 */
export interface GrantSection {
  content: string;
  wordCount: number;
  lastUpdated: Date | string;
}

/**
 * Grant with typed sections
 */
export interface GrantWithSections extends Grant {
  draftContent?: Record<string, GrantSection> | null;
}

/**
 * Standard grant sections (can be customized per funder)
 */
export const STANDARD_GRANT_SECTIONS = [
  "executive_summary",
  "project_description",
  "need_statement",
  "goals_objectives",
  "methods_activities",
  "evaluation_plan",
  "budget_narrative",
  "organizational_capacity",
  "sustainability_plan",
] as const;

/**
 * Calculate grant completion progress as a percentage
 *
 * @param grant - Grant with sections
 * @param requiredSections - List of required section names (defaults to STANDARD_GRANT_SECTIONS)
 * @returns Progress percentage (0-100)
 */
export function calculateGrantProgress(
  grant: GrantWithSections,
  requiredSections: readonly string[] = STANDARD_GRANT_SECTIONS
): number {
  if (!grant.draftContent || Object.keys(grant.draftContent).length === 0) {
    return 0;
  }

  const sections = grant.draftContent;
  const totalRequired = requiredSections.length;

  if (totalRequired === 0) {
    return 0;
  }

  // Count completed sections (with content)
  let completedSections = 0;
  let totalWordCount = 0;
  let completedWordCount = 0;

  for (const sectionName of requiredSections) {
    const section = sections[sectionName];

    if (section && section.content && section.content.trim().length > 0) {
      completedSections++;
      completedWordCount += section.wordCount || 0;
    }

    // Estimate expected word count (can be adjusted based on section type)
    totalWordCount += 500; // Average section target
  }

  // Weight by section count (70%) and word count (30%)
  const sectionProgress = (completedSections / totalRequired) * 70;
  const wordCountProgress = totalWordCount > 0
    ? (completedWordCount / totalWordCount) * 30
    : 0;

  const progress = Math.min(100, Math.round(sectionProgress + wordCountProgress));

  return progress;
}

/**
 * Get Tailwind color class based on progress percentage
 *
 * @param progress - Progress percentage (0-100)
 * @returns Tailwind background color class
 */
export function getProgressColor(progress: number): string {
  if (progress <= 25) {
    return "bg-red-500";
  } else if (progress <= 50) {
    return "bg-amber-500";
  } else if (progress <= 75) {
    return "bg-blue-500";
  } else {
    return "bg-emerald-500";
  }
}

/**
 * Calculate days remaining until deadline
 *
 * @param deadline - Deadline date or null
 * @returns Number of days remaining, null if no deadline, negative if overdue
 */
export function calculateDaysRemaining(deadline: Date | null): number | null {
  if (!deadline) {
    return null;
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);

  // Reset time to start of day for accurate day calculation
  now.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format deadline into human-readable text
 *
 * @param daysRemaining - Number of days remaining (from calculateDaysRemaining)
 * @returns Formatted deadline text
 */
export function formatDeadlineText(daysRemaining: number | null): string {
  if (daysRemaining === null) {
    return "No deadline";
  }

  if (daysRemaining < 0) {
    const daysOverdue = Math.abs(daysRemaining);
    return `Overdue by ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}`;
  }

  if (daysRemaining === 0) {
    return "Due today";
  }

  if (daysRemaining === 1) {
    return "Due tomorrow";
  }

  if (daysRemaining <= 7) {
    return `${daysRemaining} days left`;
  }

  // For 8+ days, still show days count for consistency
  // Could alternatively format as a date if preferred
  return `${daysRemaining} days left`;
}

/**
 * Get deadline urgency level
 *
 * @param daysRemaining - Number of days remaining
 * @returns Urgency level: "overdue" | "critical" | "warning" | "normal" | "none"
 */
export function getDeadlineUrgency(
  daysRemaining: number | null
): "overdue" | "critical" | "warning" | "normal" | "none" {
  if (daysRemaining === null) {
    return "none";
  }

  if (daysRemaining < 0) {
    return "overdue";
  }

  if (daysRemaining <= 3) {
    return "critical";
  }

  if (daysRemaining <= 7) {
    return "warning";
  }

  return "normal";
}

/**
 * Get deadline urgency color
 *
 * @param daysRemaining - Number of days remaining
 * @returns Tailwind text color class
 */
export function getDeadlineColor(daysRemaining: number | null): string {
  const urgency = getDeadlineUrgency(daysRemaining);

  switch (urgency) {
    case "overdue":
      return "text-red-600";
    case "critical":
      return "text-red-500";
    case "warning":
      return "text-amber-500";
    case "normal":
      return "text-blue-500";
    case "none":
    default:
      return "text-gray-500";
  }
}
