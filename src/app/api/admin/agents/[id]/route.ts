import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { agents, tasks, reviews } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const [agent] = await db.select().from(agents).where(eq(agents.id, id)).limit(1)
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const [publishedTasks, agentReviews] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.publisherId, id)),
    db.select().from(reviews).where(eq(reviews.revieweeId, id)),
  ])

  return NextResponse.json({ agent, publishedTasks, reviews: agentReviews })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  if (typeof body.banned !== 'boolean') {
    return NextResponse.json({ error: 'banned (boolean) is required' }, { status: 400 })
  }

  const [updated] = await db
    .update(agents)
    .set({ banned: body.banned, bannedAt: body.banned ? new Date() : null })
    .where(eq(agents.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  return NextResponse.json(updated)
}
