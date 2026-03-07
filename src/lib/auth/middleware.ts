import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashApiKey } from './api-key'

export type AuthenticatedAgent = {
  id: string
  name: string
  walletAddress: string | null
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedAgent | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const apiKey = authHeader.slice(7)
  const keyHash = hashApiKey(apiKey)

  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
    })
    .from(agents)
    .where(eq(agents.apiKeyHash, keyHash))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return agent
}
