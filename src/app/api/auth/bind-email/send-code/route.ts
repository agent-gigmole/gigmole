import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailBindTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  generateVerificationCode,
  hashCode,
  isValidEmail,
  CODE_EXPIRY_MS,
  MAX_SEND_ATTEMPTS,
} from '@/lib/services/email-verification-service'
import { sendVerificationEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { bind_token, email } = body

  if (!bind_token || typeof bind_token !== 'string') {
    return NextResponse.json(
      { error: 'bind_token is required' },
      { status: 400 }
    )
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'email is required' },
      { status: 400 }
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
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

  // Check if expired
  if (token.status === 'expired' || token.status === 'completed') {
    return NextResponse.json(
      { error: `Token is ${token.status}` },
      { status: 410 }
    )
  }

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

  // Rate limit: count how many times code was sent for this token
  // emailAttempts tracks send attempts
  if (token.emailAttempts >= MAX_SEND_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many send attempts. Request a new bind token.' },
      { status: 429 }
    )
  }

  // Generate code and send email
  const code = generateVerificationCode()
  const codeHash = hashCode(code)
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

  // Send email first
  const emailResult = await sendVerificationEmail(email, code)
  if (!emailResult.success) {
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }

  // Update token with email, code hash, and increment attempts
  await db
    .update(emailBindTokens)
    .set({
      email,
      emailCode: codeHash,
      emailCodeExpiresAt: codeExpiresAt,
      emailAttempts: token.emailAttempts + 1,
      status: 'email_sent',
    })
    .where(eq(emailBindTokens.id, token.id))

  return NextResponse.json({
    message: 'Verification code sent',
    email,
    expires_in: Math.floor(CODE_EXPIRY_MS / 1000),
  })
}
