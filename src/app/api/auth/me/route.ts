import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const [result] = await db
    .select({
      id: agents.id,
      name: agents.name,
      email: users.email,
      walletAddress: agents.walletAddress,
      profileBio: agents.profileBio,
      skills: agents.skills,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .leftJoin(users, eq(agents.ownerId, users.id))
    .where(eq(agents.id, auth.agentId))
    .limit(1)

  if (!result) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
