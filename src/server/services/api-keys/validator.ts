import { PrismaClient, ApiKey } from '@prisma/client'
import { extractKeyPrefix } from './generator'
import { verifyApiKey } from './hasher'

/**
 * Result of API key validation
 */
export interface ApiKeyValidationResult {
  valid: boolean
  apiKey?: ApiKey
  organizationId?: string
  reason?: 'not_found' | 'invalid_hash' | 'expired' | 'revoked'
}

/**
 * Validate an API key against the database
 *
 * @param fullKey - Full API key from request header
 * @param db - Prisma client instance
 * @returns Validation result with API key and organization ID if valid
 */
export async function validateApiKey(
  fullKey: string,
  db: PrismaClient
): Promise<ApiKeyValidationResult> {
  // Extract the key prefix for database lookup
  const keyPrefix = extractKeyPrefix(fullKey)

  // Find API key by prefix (indexed query)
  const apiKey = await db.apiKey.findFirst({
    where: {
      keyPrefix,
      revokedAt: null, // Not revoked
    },
    include: {
      rateLimits: true,
    },
  })

  if (!apiKey) {
    return {
      valid: false,
      reason: 'not_found',
    }
  }

  // Check if expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return {
      valid: false,
      reason: 'expired',
    }
  }

  // Verify full key with bcrypt
  const isValid = await verifyApiKey(fullKey, apiKey.keyHash)

  if (!isValid) {
    return {
      valid: false,
      reason: 'invalid_hash',
    }
  }

  // Valid API key!
  return {
    valid: true,
    apiKey,
    organizationId: apiKey.organizationId,
  }
}

/**
 * Update API key last used metadata
 *
 * @param apiKeyId - API key ID
 * @param ipAddress - Client IP address
 * @param db - Prisma client instance
 */
export async function updateApiKeyLastUsed(
  apiKeyId: string,
  ipAddress: string | null,
  db: PrismaClient
): Promise<void> {
  await db.apiKey.update({
    where: { id: apiKeyId },
    data: {
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress,
      requestCount: { increment: 1 },
    },
  })
}

/**
 * Check if an API key has a specific scope
 *
 * @param apiKey - API key to check
 * @param requiredScopes - Scopes to check for (any match is sufficient)
 * @returns True if the key has at least one of the required scopes
 */
export function hasScope(apiKey: ApiKey, requiredScopes: string[]): boolean {
  return requiredScopes.some(scope => apiKey.scopes.includes(scope))
}
