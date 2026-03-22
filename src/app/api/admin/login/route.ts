import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth/admin'

// Rate limiting — 5 attempts per IP per minute
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const attempt = loginAttempts.get(ip)
  if (attempt && now < attempt.resetAt) {
    if (attempt.count >= 5) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
    }
    attempt.count++
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
  }

  const body = await request.json()
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = createSessionToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
