import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeyResetTokens, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  isValidEmail,
  generateVerificationCode,
  hashCode,
  CODE_EXPIRY_MS,
} from '@/lib/services/email-verification-service'
import { sendApiKeyResetEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { email } = body

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

  // Always return success to not leak whether email exists
  const successResponse = NextResponse.json({
    message: 'If an account with this email exists, a reset code has been sent.',
  })

  // Look up user
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    // Don't reveal that email doesn't exist
    return successResponse
  }

  // Generate code
  const code = generateVerificationCode()
  const codeHash = hashCode(code)

  // Store reset token
  await db.insert(apiKeyResetTokens).values({
    userId: user.id,
    email,
    codeHash,
    codeExpiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
  })

  // Send email
  await sendApiKeyResetEmail(email, code)

  return successResponse
}
