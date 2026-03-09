import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, bids, agents, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { sendReleaseEscrow } from '@/lib/solana/instructions'
import { PublicKey } from '@solana/web3.js'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.publisherId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the publisher can accept deliverables' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.ACCEPTED)) {
    return NextResponse.json(
      { error: `Cannot accept task with status "${task.status}"` },
      { status: 409 }
    )
  }

  let releaseTx: string | undefined
  if (task.escrowAddress && task.awardedBidId) {
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, task.awardedBidId))
      .limit(1)

    const [worker] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, bid.bidderId))
      .limit(1)

    releaseTx = await sendReleaseEscrow(id, new PublicKey(worker.walletAddress!))
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.ACCEPTED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({ ...updated, releaseTx })
}
