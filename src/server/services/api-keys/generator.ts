import crypto from 'crypto'

/**
 * API Key Format: gs_{env}_{random}
 * Example: gs_live_abc123def456ghi789jkl012
 *
 * Prefix (visible, stored): gs_live_abc12345 (first 16 chars)
 * Full key: Used for authentication, hashed with bcrypt
 */

export interface GeneratedApiKey {
  fullKey: string       // Full key to show user ONCE (e.g., "gs_live_abc123def456ghi789jkl012")
  keyPrefix: string     // First 16 chars to store for lookup (e.g., "gs_live_abc12345")
}

/**
 * Generate a new API key in the format gs_{env}_{random}
 *
 * @param isProduction - Whether to generate a live or test key
 * @returns Generated API key with full key and prefix
 */
export function generateApiKey(isProduction = true): GeneratedApiKey {
  const env = isProduction ? 'live' : 'test'

  // Generate 32 bytes of random data (256 bits)
  // This will be encoded as base62 for a URL-safe key
  const randomBytes = crypto.randomBytes(32)

  // Convert to base62 (alphanumeric, no special chars)
  const randomString = base62Encode(randomBytes)

  // Format: gs_{env}_{random}
  const fullKey = `gs_${env}_${randomString}`

  // Extract prefix (first 16 characters)
  const keyPrefix = fullKey.substring(0, 16)

  return {
    fullKey,
    keyPrefix
  }
}

/**
 * Base62 encoding (alphanumeric: 0-9, A-Z, a-z)
 * URL-safe without special characters
 */
function base62Encode(buffer: Buffer): string {
  const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ''

  // Convert buffer to bigint
  let num = BigInt('0x' + buffer.toString('hex'))

  // Convert to base62
  while (num > 0) {
    const remainder = Number(num % BigInt(62))
    result = base62Chars[remainder] + result
    num = num / BigInt(62)
  }

  // Pad to consistent length (43 chars for 32 bytes)
  return result.padStart(43, '0')
}

/**
 * Extract the key prefix from a full API key
 *
 * @param fullKey - Full API key
 * @returns Key prefix (first 16 chars)
 */
export function extractKeyPrefix(fullKey: string): string {
  return fullKey.substring(0, 16)
}

/**
 * Validate API key format (basic syntax check)
 *
 * @param key - API key to validate
 * @returns True if format is valid
 */
export function isValidKeyFormat(key: string): boolean {
  // Format: gs_(live|test)_[base62 chars]
  const keyRegex = /^gs_(live|test)_[0-9A-Za-z]{43,}$/
  return keyRegex.test(key)
}
