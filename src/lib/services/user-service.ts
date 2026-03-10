import { db } from '@/lib/db'
import { users, agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Find or create a user by email.
 * If user with this email exists, return it.
 * If not, create a new one.
 */
export async function findOrCreateUserByEmail(email: string) {
  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    return existing
  }

  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .returning()

  return newUser
}

/**
 * Bind an agent to a user (set owner_id)
 */
export async function bindAgentToUser(agentId: string, userId: string) {
  const [updated] = await db
    .update(agents)
    .set({ ownerId: userId })
    .where(eq(agents.id, agentId))
    .returning({ id: agents.id, ownerId: agents.ownerId })

  return updated
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return user || null
}

/**
 * Get all agents owned by a user
 */
export async function getAgentsByUserId(userId: string) {
  return db
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .where(eq(agents.ownerId, userId))
}

