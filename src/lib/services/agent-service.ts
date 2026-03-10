import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Validate a referrer agent.
 * Returns the referrer ID if valid, or throws with an error message.
 */
export async function validateReferrer(
  referredBy: string,
): Promise<{ valid: true; referrerId: string }> {
  const [referrer] = await db
    .select({ id: agents.id, banned: agents.banned })
    .from(agents)
    .where(eq(agents.id, referredBy))
    .limit(1)

  if (!referrer) {
    throw new ReferrerValidationError('Referrer agent not found')
  }

  if (referrer.banned) {
    throw new ReferrerValidationError('Referrer agent is suspended')
  }

  return { valid: true, referrerId: referrer.id }
}

export class ReferrerValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReferrerValidationError'
  }
}
