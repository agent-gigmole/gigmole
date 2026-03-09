import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailBindTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  verifyCode,
  MAX_VERIFY_ATTEMPTS,
} from '@/lib/services/email-verification-service'
import {
  findOrCreateUserByEmail,
  bindAgentToUser,
  isEmailTaken,
} from '@/lib/services/user-service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { bind_token, code } = body

  if (!bind_token || typeof bind_token !== 'string') {
    return NextResponse.json(
      { error: 'bind_token is required' },
      { status: 400 }
    )
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400 }
    )
  }

  // Look up token
  const [token] = await db
    .select()
    .from(emailBindTokens)
    .where(eq(emailBindTokens.bindToken, bind_token))
    .limit(1)

  if (!token) {
    return NextResponse.json(
      { error: 'Invalid bind token' },
      { status: 404 }
    )
  }

  // Check status
  if (token.status === 'expired' || token.status === 'completed') {
    return NextResponse.json(
      { error: `Token is ${token.status}` },
      { status: 410 }
    )
  }

  if (token.status !== 'email_sent') {
    return NextResponse.json(
      { error: 'No verification code has been sent yet' },
      { status: 400 }
    )
  }

  // Check token expiry
  if (new Date() > token.expiresAt) {
    await db
      .update(emailBindTokens)
      .set({ status: 'expired' })
      .where(eq(emailBindTokens.id, token.id))
    return NextResponse.json(
      { error: 'Token has expired' },
      { status: 410 }
    )
  }

  // Check attempt limit
  if (token.emailAttempts >= MAX_VERIFY_ATTEMPTS) {
    await db
      .update(emailBindTokens)
      .set({ status: 'expired' })
      .where(eq(emailBindTokens.id, token.id))
    return NextResponse.json(
      { error: 'Too many failed attempts. Request a new bind token.' },
      { status: 429 }
    )
  }

  // Check code expiry
  if (!token.emailCodeExpiresAt || new Date() > token.emailCodeExpiresAt) {
    return NextResponse.json(
      { error: 'Verification code has expired. Request a new one.' },
      { status: 410 }
    )
  }

  // Verify code
  if (!token.emailCode || !verifyCode(code, token.emailCode)) {
    // Increment attempts
    await db
      .update(emailBindTokens)
      .set({ emailAttempts: token.emailAttempts + 1 })
      .where(eq(emailBindTokens.id, token.id))

    const remaining = MAX_VERIFY_ATTEMPTS - token.emailAttempts - 1
    return NextResponse.json(
      {
        error: 'Invalid verification code',
        attempts_remaining: Math.max(0, remaining),
      },
      { status: 400 }
    )
  }

  // Code is correct! Check if email is already taken by another user
  // who has agents other than this one
  const email = token.email!

  // Find or create user, bind agent
  const user = await findOrCreateUserByEmail(email)
  await bindAgentToUser(token.agentId, user.id)

  // Mark token as completed
  await db
    .update(emailBindTokens)
    .set({ status: 'completed' })
    .where(eq(emailBindTokens.id, token.id))

  return NextResponse.json({
    message: 'Email bound successfully',
    email,
    user_id: user.id,
  })
}
