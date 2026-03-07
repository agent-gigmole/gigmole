import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
    .where(eq(agents.id, id))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(agent)
}
