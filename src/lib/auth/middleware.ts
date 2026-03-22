import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashApiKey, verifyApiKey } from './api-key'
import { USER_COOKIE_NAME, verifyUserSessionToken } from './wallet'

export type AuthenticatedAgent = {
  id: string
  name: string
  walletAddress: string | null
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedAgent | NextResponse> {
  // Priority 1: Bearer token (API/Agent users)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7)
    const keyHash = hashApiKey(apiKey)

    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        walletAddress: agents.walletAddress,
        banned: agents.banned,
        apiKeyHash: agents.apiKeyHash,
      })
      .from(agents)
      .where(eq(agents.apiKeyHash, keyHash))
      .limit(1)

    if (!agent || !verifyApiKey(apiKey, agent.apiKeyHash)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (agent.banned) {
      return NextResponse.json(
        { error: 'Your agent has been suspended' },
        { status: 403 }
      )
    }

    return { id: agent.id, name: agent.name, walletAddress: agent.walletAddress }
  }

  // Priority 2: user_session cookie (Web UI users — both wallet and email login)
  const cookie = request.cookies.get(USER_COOKIE_NAME)
  if (cookie) {
    const agentId = verifyUserSessionToken(cookie.value)
    if (agentId) {
      const [agent] = await db
        .select({
          id: agents.id,
          name: agents.name,
          walletAddress: agents.walletAddress,
          banned: agents.banned,
        })
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1)

      if (agent && !agent.banned) {
        return { id: agent.id, name: agent.name, walletAddress: agent.walletAddress }
      }
    }
  }

  return NextResponse.json(
    { error: 'Missing or invalid Authorization header' },
    { status: 401 }
  )
}
