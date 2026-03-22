import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

export const USER_COOKIE_NAME = 'user_session'

export function buildSignInMessage(nonce: string): string {
  return `Sign in to GigMole\nNonce: ${nonce}`
}

function getSecret(): string {
  const secret = process.env.USER_SESSION_SECRET
  if (!secret) {
    throw new Error('USER_SESSION_SECRET environment variable is required')
  }
  return secret
}

// --- Nonce replay protection ---
// Used nonces with TTL-based cleanup (5 minutes)
const usedNonces = new Map<string, number>()
const NONCE_TTL_MS = 5 * 60 * 1000

function cleanupExpiredNonces(): void {
  const now = Date.now()
  for (const [key, expiresAt] of usedNonces) {
    if (now >= expiresAt) {
      usedNonces.delete(key)
    }
  }
}

export function markNonceUsed(nonce: string): void {
  cleanupExpiredNonces()
  usedNonces.set(nonce, Date.now() + NONCE_TTL_MS)
}

export function isNonceUsed(nonce: string): boolean {
  cleanupExpiredNonces()
  return usedNonces.has(nonce)
}

// --- Nonce ---

export function generateNonce(
  walletAddress: string,
  ts?: number
): { nonce: string; timestamp: number } {
  const timestamp = ts ?? Date.now()
  const data = `${walletAddress}:${timestamp}`
  const nonce = createHmac('sha256', getSecret()).update(data).digest('hex')
  return { nonce, timestamp }
}

export function verifyNonce(
  walletAddress: string,
  nonce: string,
  timestamp: number
): boolean {
  if (Date.now() - timestamp > 5 * 60 * 1000) return false
  const expected = createHmac('sha256', getSecret())
    .update(`${walletAddress}:${timestamp}`)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(nonce, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

// --- Signature verification ---

export async function verifyWalletSignature(
  publicKeyBase58: string,
  signature: Uint8Array,
  message: string
): Promise<boolean> {
  const { default: nacl } = await import('tweetnacl')
  const { default: bs58 } = await import('bs58')
  try {
    const publicKeyBytes = bs58.decode(publicKeyBase58)
    const messageBytes = new TextEncoder().encode(message)
    return nacl.sign.detached.verify(messageBytes, signature, publicKeyBytes)
  } catch {
    return false
  }
}

// --- Session tokens ---

export function createUserSessionToken(agentId: string): string {
  const payload = `user:${agentId}:${Date.now()}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64')}.${signature}`
}

export function verifyUserSessionToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, signature] = parts
  try {
    const payload = Buffer.from(payloadB64, 'base64').toString()
    if (!payload.startsWith('user:')) return null
    const segments = payload.split(':')
    if (segments.length !== 3) return null
    const [, agentId, tsStr] = segments
    const ts = parseInt(tsStr, 10)
    if (isNaN(ts) || Date.now() - ts > 24 * 60 * 60 * 1000) return null
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return null
    }
    return agentId
  } catch {
    return null
  }
}

export async function authenticateUser(
  request: NextRequest
): Promise<{ agentId: string } | NextResponse> {
  const cookie = request.cookies.get(USER_COOKIE_NAME)
  if (!cookie) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const agentId = verifyUserSessionToken(cookie.value)
  if (!agentId) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
  return { agentId }
}
