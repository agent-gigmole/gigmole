import { db } from '@/lib/db'
import { agents, emailBindTokens } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  generateBindToken,
  generateVerificationCode,
  hashCode,
  verifyCode as verifyCodeHash,
  isValidEmail,
  BIND_TOKEN_EXPIRY_MS,
  CODE_EXPIRY_MS,
  MAX_SEND_ATTEMPTS,
  MAX_VERIFY_ATTEMPTS,
} from '@/lib/services/verification-utils'
import { sendVerificationEmail } from '@/lib/email/resend'
import { findOrCreateUserByEmail, bindAgentToUser } from '@/lib/services/user-service'

export type BindStatus = 'pending' | 'email_sent' | 'completed' | 'expired'

export class EmailBindError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'EmailBindError'
  }
}

/**
 * Create a new email bind request for an agent.
 * Expires any existing pending/email_sent tokens for this agent.
 */
export async function createBindRequest(
  agentId: string,
): Promise<{ bindToken: string; bindUrl: string; expiresIn: number }> {
  // Check if agent already has email bound (via owner_id)
  const [agentRow] = await db
    .select({ ownerId: agents.ownerId })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1)

  if (agentRow?.ownerId) {
    throw new EmailBindError('Agent already has an email bound', 409)
  }

  // Expire all pending tokens for this agent
  await db
    .update(emailBindTokens)
    .set({ status: 'expired' })
    .where(
      and(
        eq(emailBindTokens.agentId, agentId),
        eq(emailBindTokens.status, 'pending')
      )
    )

  // Also expire email_sent tokens
  await db
    .update(emailBindTokens)
    .set({ status: 'expired' })
    .where(
      and(
        eq(emailBindTokens.agentId, agentId),
        eq(emailBindTokens.status, 'email_sent')
      )
    )

  // Generate new bind token
  const bindToken = generateBindToken()
  const expiresAt = new Date(Date.now() + BIND_TOKEN_EXPIRY_MS)

  await db.insert(emailBindTokens).values({
    agentId,
    bindToken,
    expiresAt,
    status: 'pending',
  })

  return {
    bindToken,
    bindUrl: `https://gigmole.cc/bind/${bindToken}`,
    expiresIn: Math.floor(BIND_TOKEN_EXPIRY_MS / 1000),
  }
}

/**
 * Send a verification code to the email associated with a bind token.
 */
export async function sendVerificationCode(
  bindToken: string,
  email: string,
): Promise<{ email: string; expiresIn: number }> {
  if (!isValidEmail(email)) {
    throw new EmailBindError('Invalid email format', 400)
  }

  // Look up token
  const [token] = await db
    .select()
    .from(emailBindTokens)
    .where(eq(emailBindTokens.bindToken, bindToken))
    .limit(1)

  if (!token) {
    throw new EmailBindError('Invalid bind token', 404)
  }

  // Check if expired
  if (token.status === 'expired' || token.status === 'completed') {
    throw new EmailBindError(`Token is ${token.status}`, 410)
  }

  if (new Date() > token.expiresAt) {
    await db
      .update(emailBindTokens)
      .set({ status: 'expired' })
      .where(eq(emailBindTokens.id, token.id))
    throw new EmailBindError('Token has expired', 410)
  }

  // Rate limit: count how many times code was sent for this token
  if (token.emailAttempts >= MAX_SEND_ATTEMPTS) {
    throw new EmailBindError('Too many send attempts. Request a new bind token.', 429)
  }

  // Generate code and send email
  const code = generateVerificationCode()
  const codeHash = hashCode(code)
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MS)

  // Send email first
  const emailResult = await sendVerificationEmail(email, code)
  if (!emailResult.success) {
    throw new EmailBindError('Failed to send verification email', 500)
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

  return {
    email,
    expiresIn: Math.floor(CODE_EXPIRY_MS / 1000),
  }
}

/**
 * Verify a code submitted against a bind token.
 * On success, creates/finds user by email and binds the agent.
 */
export async function verifyCode(
  bindToken: string,
  code: string,
): Promise<{ success: true; email: string; userId: string }> {
  // Look up token
  const [token] = await db
    .select()
    .from(emailBindTokens)
    .where(eq(emailBindTokens.bindToken, bindToken))
    .limit(1)

  if (!token) {
    throw new EmailBindError('Invalid bind token', 404)
  }

  // Check status
  if (token.status === 'expired' || token.status === 'completed') {
    throw new EmailBindError(`Token is ${token.status}`, 410)
  }

  if (token.status !== 'email_sent') {
    throw new EmailBindError('No verification code has been sent yet', 400)
  }

  // Check token expiry
  if (new Date() > token.expiresAt) {
    await db
      .update(emailBindTokens)
      .set({ status: 'expired' })
      .where(eq(emailBindTokens.id, token.id))
    throw new EmailBindError('Token has expired', 410)
  }

  // Check attempt limit
  if (token.emailAttempts >= MAX_VERIFY_ATTEMPTS) {
    await db
      .update(emailBindTokens)
      .set({ status: 'expired' })
      .where(eq(emailBindTokens.id, token.id))
    throw new EmailBindError('Too many failed attempts. Request a new bind token.', 429)
  }

  // Check code expiry
  if (!token.emailCodeExpiresAt || new Date() > token.emailCodeExpiresAt) {
    throw new EmailBindError('Verification code has expired. Request a new one.', 410)
  }

  // Verify code
  if (!token.emailCode || !verifyCodeHash(code, token.emailCode)) {
    // Increment attempts
    await db
      .update(emailBindTokens)
      .set({ emailAttempts: token.emailAttempts + 1 })
      .where(eq(emailBindTokens.id, token.id))

    const remaining = MAX_VERIFY_ATTEMPTS - token.emailAttempts - 1
    throw new EmailBindError('Invalid verification code', 400, {
      attempts_remaining: Math.max(0, remaining),
    })
  }

  // Code is correct — find or create user, bind agent
  const email = token.email!
  const user = await findOrCreateUserByEmail(email)
  await bindAgentToUser(token.agentId, user.id)

  // Mark token as completed
  await db
    .update(emailBindTokens)
    .set({ status: 'completed' })
    .where(eq(emailBindTokens.id, token.id))

  return { success: true, email, userId: user.id }
}

/**
 * Get the current status of a bind token (for CLI polling).
 */
export async function getBindStatus(
  bindToken: string,
): Promise<{ status: BindStatus; email?: string }> {
  const [record] = await db
    .select({
      status: emailBindTokens.status,
      email: emailBindTokens.email,
      expiresAt: emailBindTokens.expiresAt,
    })
    .from(emailBindTokens)
    .where(eq(emailBindTokens.bindToken, bindToken))
    .limit(1)

  if (!record) {
    throw new EmailBindError('Invalid token', 404)
  }

  // Check if expired by time
  let status = record.status as BindStatus
  if (status !== 'completed' && status !== 'expired' && new Date() > record.expiresAt) {
    status = 'expired'
  }

  const response: { status: BindStatus; email?: string } = { status }
  if (status === 'completed' && record.email) {
    response.email = record.email
  }

  return response
}
