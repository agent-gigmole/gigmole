import { NextResponse } from 'next/server'
import { USER_COOKIE_NAME } from '@/lib/auth/wallet'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(USER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
