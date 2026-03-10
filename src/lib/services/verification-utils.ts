import crypto from 'crypto'

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  // Generate a random number between 100000 and 999999
  const code = crypto.randomInt(100000, 1000000)
  return code.toString()
}

/**
 * Hash a verification code for storage (never store plaintext)
 */
export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Timing-safe comparison of a code against a hash
 */
export function verifyCode(code: string, storedHash: string): boolean {
  try {
    const candidateHash = hashCode(code)
    return crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Generate a bind token (64 hex chars = 32 random bytes)
 */
export function generateBindToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Code expiry duration: 5 minutes
 */
export const CODE_EXPIRY_MS = 5 * 60 * 1000

/**
 * Bind token expiry duration: 10 minutes
 */
export const BIND_TOKEN_EXPIRY_MS = 10 * 60 * 1000

/**
 * Max email send attempts per token
 */
export const MAX_SEND_ATTEMPTS = 3

/**
 * Max code verification attempts per token
 */
export const MAX_VERIFY_ATTEMPTS = 5
