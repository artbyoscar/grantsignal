import { ApiKey, PrismaClient } from '@prisma/client'
import { validateApiKey, updateApiKeyLastUsed } from '@/server/services/api-keys/validator'
import { isValidKeyFormat } from '@/server/services/api-keys/generator'

/**
 * Authenticated API key context
 */
export interface ApiKeyAuthContext {
  organizationId: string
  apiKey: ApiKey
}

/**
 * Extract client IP address from request
 */
function getClientIp(request: Request): string | null {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first one
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Vercel/Cloudflare specific
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return null
}

/**
 * Authenticate API request using Bearer token (API key)
 *
 * @param request - Incoming HTTP request
 * @param db - Prisma client instance
 * @returns Authentication context with organizationId and apiKey, or null if invalid
 */
export async function authenticateApiKey(
  request: Request,
  db: PrismaClient
): Promise<ApiKeyAuthContext | null> {
  // Extract Authorization header
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return null
  }

  // Check for Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  // Extract the API key
  const apiKey = authHeader.substring(7).trim()

  // Basic format validation (fast check before database lookup)
  if (!isValidKeyFormat(apiKey)) {
    return null
  }

  // Validate against database
  const result = await validateApiKey(apiKey, db)

  if (!result.valid || !result.apiKey || !result.organizationId) {
    return null
  }

  // Update last used metadata (fire and forget)
  const clientIp = getClientIp(request)
  updateApiKeyLastUsed(result.apiKey.id, clientIp, db).catch(err => {
    console.error('Failed to update API key last used:', err)
  })

  return {
    organizationId: result.organizationId,
    apiKey: result.apiKey,
  }
}
