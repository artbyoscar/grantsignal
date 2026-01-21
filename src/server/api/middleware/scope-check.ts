import { ApiKey } from '@prisma/client'

/**
 * API Key Scopes
 * These define what actions an API key is authorized to perform
 */
export const API_SCOPES = {
  // Grant permissions
  GRANTS_READ: 'grants:read',
  GRANTS_WRITE: 'grants:write',

  // Document permissions
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_WRITE: 'documents:write',

  // Report permissions
  REPORTS_READ: 'reports:read',

  // Webhook permissions
  WEBHOOKS_MANAGE: 'webhooks:manage',

  // Extension-specific permissions
  EXTENSION_MEMORY_SEARCH: 'extension:memory_search',
} as const

/**
 * Check if an API key has the required scope
 *
 * @param apiKey - API key to check
 * @param requiredScopes - Array of acceptable scopes (any match is sufficient)
 * @throws ScopeError if the key lacks all required scopes
 */
export function requireScope(apiKey: ApiKey, requiredScopes: string[]): void {
  const hasScope = requiredScopes.some(scope => apiKey.scopes.includes(scope))

  if (!hasScope) {
    throw new ScopeError(
      `Missing required scope. Need one of: ${requiredScopes.join(', ')}`,
      requiredScopes,
      apiKey.scopes
    )
  }
}

/**
 * Check if an API key has ALL of the specified scopes
 *
 * @param apiKey - API key to check
 * @param requiredScopes - Array of scopes (all must be present)
 * @throws ScopeError if the key lacks any required scope
 */
export function requireAllScopes(apiKey: ApiKey, requiredScopes: string[]): void {
  const missingScopes = requiredScopes.filter(scope => !apiKey.scopes.includes(scope))

  if (missingScopes.length > 0) {
    throw new ScopeError(
      `Missing required scopes: ${missingScopes.join(', ')}`,
      requiredScopes,
      apiKey.scopes
    )
  }
}

/**
 * Custom error for scope checking
 */
export class ScopeError extends Error {
  constructor(
    message: string,
    public requiredScopes: string[],
    public actualScopes: string[]
  ) {
    super(message)
    this.name = 'ScopeError'
  }
}
