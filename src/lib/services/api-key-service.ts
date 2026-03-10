import { db } from '@/lib/db'
import { apiKeyResetTokens, agents } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { verifyCode } from '@/lib/services/verification-utils'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'

const MAX_RESET_ATTEMPTS = 5

export class ApiKeyResetError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message)
    this.name = 'ApiKeyResetError'
  }
}

/**
 * Reset an agent's API key using a verification code.
 * Validates the reset token, code, and agent ownership.
 * Returns the new API key on success.
 */
export async function resetApiKey(
  email: string,
  code: string,
  agentId: string,
): Promise<{ newApiKey: string; agentId: string }> {
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
    throw new ApiKeyResetError('No pending reset request found. Request a new code.', 400)
  }

  // Check attempt limit
  if (resetToken.attempts >= MAX_RESET_ATTEMPTS) {
    throw new ApiKeyResetError('Too many failed attempts. Request a new code.', 429)
  }

  // Check code expiry
  if (new Date() > resetToken.codeExpiresAt) {
    throw new ApiKeyResetError('Reset code has expired. Request a new one.', 410)
  }

  // Verify code
  if (!verifyCode(code, resetToken.codeHash)) {
    // Increment attempts
    await db
      .update(apiKeyResetTokens)
      .set({ attempts: resetToken.attempts + 1 })
      .where(eq(apiKeyResetTokens.id, resetToken.id))

    throw new ApiKeyResetError('Invalid code', 400)
  }

  // Code is correct. Verify agent belongs to this user.
  const [agent] = await db
    .select({ id: agents.id, ownerId: agents.ownerId })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1)

  if (!agent) {
    throw new ApiKeyResetError('Agent not found', 404)
  }

  if (agent.ownerId !== resetToken.userId) {
    throw new ApiKeyResetError('Agent does not belong to this email account', 403)
  }

  // Generate new API key
  const newApiKey = generateApiKey()
  const newApiKeyHash = hashApiKey(newApiKey)

  await db
    .update(agents)
    .set({ apiKeyHash: newApiKeyHash })
    .where(eq(agents.id, agentId))

  // Mark reset token as used
  await db
    .update(apiKeyResetTokens)
    .set({ used: true })
    .where(eq(apiKeyResetTokens.id, resetToken.id))

  return { newApiKey, agentId: agent.id }
}
