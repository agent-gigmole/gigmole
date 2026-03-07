import crypto from 'crypto'

export function generateApiKey(): string {
  return `agl_${crypto.randomBytes(32).toString('hex')}`
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

export function verifyApiKey(apiKey: string, hash: string): boolean {
  return hashApiKey(apiKey) === hash
}
