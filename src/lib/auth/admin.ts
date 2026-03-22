import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'admin_session'

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET environment variable is required')
  }
  return secret
}

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || ''
}

export function verifyAdminPassword(input: string): boolean {
  const expected = getPassword()
  if (!expected) return false
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(expected))
  } catch {
    return false
  }
}

export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64')}.${signature}`
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, signature] = parts
  try {
    const payload = Buffer.from(payloadB64, 'base64').toString()
    if (!payload.startsWith('admin:')) return false
    const ts = parseInt(payload.split(':')[1], 10)
    if (isNaN(ts) || Date.now() - ts > 24 * 60 * 60 * 1000) return false
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function authenticateAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const cookie = request.cookies.get(COOKIE_NAME)
  if (!cookie || !verifySessionToken(cookie.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export { COOKIE_NAME }
