import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { proposals, proposalReplies } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  const replies = await db
    .select()
    .from(proposalReplies)
    .where(eq(proposalReplies.proposalId, id))
    .orderBy(asc(proposalReplies.createdAt))

  return NextResponse.json({ ...proposal, replies })
}
