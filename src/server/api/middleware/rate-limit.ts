import { ApiKey, PrismaClient } from '@prisma/client'

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

/**
 * Time window for rate limiting
 */
export type RateLimitWindow = 'minute' | 'hour' | 'day'

/**
 * In-memory sliding window rate limiter
 * TODO: Replace with Redis for production distributed rate limiting
 */
class InMemoryRateLimiter {
  // Map of apiKeyId:window -> array of timestamps
  private requests: Map<string, number[]> = new Map()

  // Cleanup interval (run every 5 minutes)
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Periodically clean up old entries
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000) // 5 minutes
  }

  private getWindowMs(window: RateLimitWindow): number {
    switch (window) {
      case 'minute':
        return 60_000
      case 'hour':
        return 3600_000
      case 'day':
        return 86400_000
    }
  }

  private getKey(apiKeyId: string, window: RateLimitWindow): string {
    return `${apiKeyId}:${window}`
  }

  /**
   * Check and increment rate limit
   */
  check(apiKeyId: string, window: RateLimitWindow, limit: number): RateLimitResult {
    const key = this.getKey(apiKeyId, window)
    const windowMs = this.getWindowMs(window)
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests
    let requests = this.requests.get(key) || []

    // Remove requests outside the current window
    requests = requests.filter(timestamp => timestamp > windowStart)

    // Check if limit exceeded
    if (requests.length >= limit) {
      // Find the oldest request in the window
      const oldestRequest = Math.min(...requests)
      const resetAt = new Date(oldestRequest + windowMs)

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit,
      }
    }

    // Add current request
    requests.push(now)
    this.requests.set(key, requests)

    return {
      allowed: true,
      remaining: limit - requests.length,
      resetAt: new Date(now + windowMs),
      limit,
    }
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanup() {
    const now = Date.now()
    const dayMs = 86400_000

    for (const [key, timestamps] of this.requests.entries()) {
      // Remove timestamps older than 1 day
      const filtered = timestamps.filter(timestamp => timestamp > now - dayMs)

      if (filtered.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, filtered)
      }
    }
  }

  /**
   * Destroy the rate limiter (clear interval)
   */
  destroy() {
    clearInterval(this.cleanupInterval)
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter()

/**
 * Check rate limit for an API key
 *
 * @param apiKey - API key to check
 * @param window - Time window (minute, hour, day)
 * @param db - Prisma client instance
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  apiKey: ApiKey,
  window: RateLimitWindow,
  db: PrismaClient
): Promise<RateLimitResult> {
  // Load rate limit configuration from database
  let rateLimits = apiKey.rateLimits

  if (!rateLimits) {
    // Load from database if not included in the API key
    rateLimits = await db.apiKeyRateLimit.findUnique({
      where: { apiKeyId: apiKey.id },
    })
  }

  // Default limits if not configured
  const limits = {
    minute: rateLimits?.requestsPerMinute ?? 100,
    hour: rateLimits?.requestsPerHour ?? 1000,
    day: rateLimits?.requestsPerDay ?? 10000,
  }

  const limit = limits[window]

  // Check rate limit
  return rateLimiter.check(apiKey.id, window, limit)
}

/**
 * Check rate limit and throw error if exceeded
 * Convenience function for use in route handlers
 *
 * @param apiKey - API key to check
 * @param db - Prisma client instance
 * @throws Error if rate limit exceeded
 */
export async function enforceRateLimit(
  apiKey: ApiKey,
  db: PrismaClient
): Promise<void> {
  // Check all three windows (minute is most restrictive)
  const minuteCheck = await checkRateLimit(apiKey, 'minute', db)

  if (!minuteCheck.allowed) {
    const retryAfter = Math.ceil((minuteCheck.resetAt.getTime() - Date.now()) / 1000)
    throw new RateLimitError(
      'Rate limit exceeded',
      minuteCheck.limit,
      minuteCheck.remaining,
      retryAfter
    )
  }

  const hourCheck = await checkRateLimit(apiKey, 'hour', db)

  if (!hourCheck.allowed) {
    const retryAfter = Math.ceil((hourCheck.resetAt.getTime() - Date.now()) / 1000)
    throw new RateLimitError(
      'Hourly rate limit exceeded',
      hourCheck.limit,
      hourCheck.remaining,
      retryAfter
    )
  }

  const dayCheck = await checkRateLimit(apiKey, 'day', db)

  if (!dayCheck.allowed) {
    const retryAfter = Math.ceil((dayCheck.resetAt.getTime() - Date.now()) / 1000)
    throw new RateLimitError(
      'Daily rate limit exceeded',
      dayCheck.limit,
      dayCheck.remaining,
      retryAfter
    )
  }
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public limit: number,
    public remaining: number,
    public retryAfter: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}
