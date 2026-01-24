import * as Sentry from "@sentry/nextjs";

/**
 * Sets user context in Sentry for error tracking.
 * Only includes user ID and org ID - never PII like names or emails.
 */
export function setSentryUserContext(userId: string, orgId?: string) {
  Sentry.setUser({
    id: userId,
    // Use custom context for org ID to avoid including in user object
  });

  if (orgId) {
    Sentry.setTag("organization_id", orgId);
  }
}

/**
 * Clears user context from Sentry (e.g., on logout)
 */
export function clearSentryUserContext() {
  Sentry.setUser(null);
}

/**
 * Captures an exception with additional context
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Captures a message for debugging/monitoring
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Adds breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
