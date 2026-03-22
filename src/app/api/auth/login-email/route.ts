import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, agents } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth/password'
import { createUserSessionToken, USER_COOKIE_NAME } from '@/lib/auth/wallet'

// P0: Rate limiting — 5 attempts per email per minute
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const key = email.toLowerCase().trim()
  const now = Date.now()
  const attempt = loginAttempts.get(key)
  if (attempt && now < attempt.resetAt) {
    if (attempt.count >= 5) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
    }
    attempt.count++
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + 60_000 })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, key))
    .limit(1)

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // P2: ORDER BY created_at ASC for deterministic agent selection
  const [agent] = await db
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .where(eq(agents.ownerId, user.id))
    .orderBy(asc(agents.createdAt))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'No agent found for this account' }, { status: 404 })
  }

  const sessionToken = createUserSessionToken(agent.id)
  const response = NextResponse.json({
    user: { id: user.id, email: user.email },
    agent: { id: agent.id, name: agent.name },
  })

  response.cookies.set(USER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  })

  return response
}
