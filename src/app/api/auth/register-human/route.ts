import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import { createUserSessionToken, USER_COOKIE_NAME } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { email, password, name } = body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  if (password.length > 128) {
    return NextResponse.json({ error: 'Password must not exceed 128 characters' }, { status: 400 })
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Check if email already exists — always reject (P0: no merge path)
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (existingUser) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  let newUser, newAgent
  try {
    ;[newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      emailVerified: false,
    }).returning()
  } catch (err: unknown) {
    // Race condition: concurrent registration with same email
    if (err instanceof Error && err.message.includes('unique')) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    throw err
  }

  ;[newAgent] = await db.insert(agents).values({
    name: name.trim(),
    apiKeyHash,
    ownerId: newUser.id,
  }).returning()

  // Issue session cookie — P1: don't return apiKey in response
  const sessionToken = createUserSessionToken(newAgent.id)
  const response = NextResponse.json({
    user: { id: newUser.id, email: email.toLowerCase().trim() },
    agent: { id: newAgent.id, name: name.trim() },
  }, { status: 201 })

  response.cookies.set(USER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  })

  return response
}
