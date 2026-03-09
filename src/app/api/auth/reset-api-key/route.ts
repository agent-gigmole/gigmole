import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeyResetTokens, users, agents } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { verifyCode } from '@/lib/services/email-verification-service'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'

const MAX_RESET_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { email, code, agent_id } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'email is required' },
      { status: 400 }
    )
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400 }
    )
  }

  if (!agent_id || typeof agent_id !== 'string') {
    return NextResponse.json(
      { error: 'agent_id is required' },
      { status: 400 }
    )
  }

  // Find the most recent unused reset token for this email
  const [resetToken] = await db
    .select()
    .from(apiKeyResetTokens)
    .where(
      and(
        eq(apiKeyResetTokens.email, email),
        eq(apiKeyResetTokens.used, false)
      )
    )
    .orderBy(desc(apiKeyResetTokens.createdAt))
    .limit(1)

  if (!resetToken) {
    return NextResponse.json(
      { error: 'No pending reset request found. Request a new code.' },
      { status: 400 }
    )
  }

  // Check attempt limit
  if (resetToken.attempts >= MAX_RESET_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Request a new code.' },
      { status: 429 }
    )
  }

  // Check code expiry
  if (new Date() > resetToken.codeExpiresAt) {
    return NextResponse.json(
      { error: 'Reset code has expired. Request a new one.' },
      { status: 410 }
    )
  }

  // Verify code
  if (!verifyCode(code, resetToken.codeHash)) {
    // Increment attempts
    await db
      .update(apiKeyResetTokens)
      .set({ attempts: resetToken.attempts + 1 })
      .where(eq(apiKeyResetTokens.id, resetToken.id))

    return NextResponse.json(
      { error: 'Invalid code' },
      { status: 400 }
    )
  }

  // Code is correct. Verify agent belongs to this user.
  const [agent] = await db
    .select({ id: agents.id, ownerId: agents.ownerId })
    .from(agents)
    .where(eq(agents.id, agent_id))
    .limit(1)

  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    )
  }

  if (agent.ownerId !== resetToken.userId) {
    return NextResponse.json(
      { error: 'Agent does not belong to this email account' },
      { status: 403 }
    )
  }

  // Generate new API key
  const newApiKey = generateApiKey()
  const newApiKeyHash = hashApiKey(newApiKey)

  await db
    .update(agents)
    .set({ apiKeyHash: newApiKeyHash })
    .where(eq(agents.id, agent_id))

  // Mark reset token as used
  await db
    .update(apiKeyResetTokens)
    .set({ used: true })
    .where(eq(apiKeyResetTokens.id, resetToken.id))

  return NextResponse.json({
    api_key: newApiKey,
    agent_id: agent.id,
    message: 'API key has been reset. Save your new key — old key is now invalid.',
  })
}
