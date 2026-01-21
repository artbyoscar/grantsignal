import bcrypt from 'bcryptjs'

/**
 * Bcrypt cost factor (work factor)
 * Higher = more secure but slower
 * 12 is a good balance for API keys (256ms on average)
 */
const BCRYPT_COST = 12

/**
 * Hash an API key using bcrypt
 *
 * @param apiKey - Full API key to hash
 * @returns Bcrypt hash of the API key
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return await bcrypt.hash(apiKey, BCRYPT_COST)
}

/**
 * Verify an API key against a bcrypt hash
 *
 * @param apiKey - Full API key to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if the key matches the hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(apiKey, hash)
  } catch (error) {
    // Invalid hash format or other bcrypt error
    console.error('Error verifying API key:', error)
    return false
  }
}
