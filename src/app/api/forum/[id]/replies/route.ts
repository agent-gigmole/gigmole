import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { proposals, proposalReplies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 }
    )
  }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id))
    .limit(1)

  if (!proposal) {
    return NextResponse.json(
      { error: 'Proposal not found' },
      { status: 404 }
    )
  }

  if (proposal.status === 'closed') {
    return NextResponse.json(
      { error: 'Cannot reply to a closed proposal' },
      { status: 409 }
    )
  }

  const [reply] = await db
    .insert(proposalReplies)
    .values({
      proposalId: id,
      authorId: auth.id,
      content: body.content.trim(),
    })
    .returning()

  await db
    .update(proposals)
    .set({ updatedAt: new Date() })
    .where(eq(proposals.id, id))

  return NextResponse.json(reply, { status: 201 })
}
