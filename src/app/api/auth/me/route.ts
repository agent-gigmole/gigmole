import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
      profileBio: agents.profileBio,
      skills: agents.skills,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.id, auth.agentId))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(agent)
}
