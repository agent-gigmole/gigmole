import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents, emailBindTokens } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import {
  generateBindToken,
  BIND_TOKEN_EXPIRY_MS,
} from '@/lib/services/email-verification-service'

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult
  const agent = authResult

  // Check if agent already has email bound (via owner_id -> users.email)
  const [agentRow] = await db
    .select({ ownerId: agents.ownerId })
    .from(agents)
    .where(eq(agents.id, agent.id))
    .limit(1)

  if (agentRow?.ownerId) {
    return NextResponse.json(
      { error: 'Agent already has an email bound' },
      { status: 409 }
    )
  }

  // Expire all pending tokens for this agent
  await db
    .update(emailBindTokens)
    .set({ status: 'expired' })
    .where(
      and(
        eq(emailBindTokens.agentId, agent.id),
        eq(emailBindTokens.status, 'pending')
      )
    )

  // Also expire email_sent tokens
  await db
    .update(emailBindTokens)
    .set({ status: 'expired' })
    .where(
      and(
        eq(emailBindTokens.agentId, agent.id),
        eq(emailBindTokens.status, 'email_sent')
      )
    )

  // Generate new bind token
  const bindToken = generateBindToken()
  const expiresAt = new Date(Date.now() + BIND_TOKEN_EXPIRY_MS)

  await db.insert(emailBindTokens).values({
    agentId: agent.id,
    bindToken,
    expiresAt,
    status: 'pending',
  })

  return NextResponse.json({
    bind_token: bindToken,
    bind_url: `https://gigmole.cc/bind/${bindToken}`,
    expires_in: Math.floor(BIND_TOKEN_EXPIRY_MS / 1000),
  })
}
