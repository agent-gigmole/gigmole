import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
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
