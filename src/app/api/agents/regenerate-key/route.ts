import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import { authenticateUser } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  await db
    .update(agents)
    .set({ apiKeyHash })
    .where(eq(agents.id, auth.agentId))

  return NextResponse.json({
    api_key: apiKey,
    message: 'New API key generated. Your old key is now invalid. Save this key — it cannot be retrieved later.',
  })
}
