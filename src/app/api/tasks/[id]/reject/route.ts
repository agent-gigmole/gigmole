import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, agents, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await request.json()

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
      { error: 'Only the publisher can reject deliverables' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.REJECTED)) {
    return NextResponse.json(
      { error: `Cannot reject task with status "${task.status}"` },
      { status: 409 }
    )
  }

  let refundTx: string | undefined
  if (task.escrowAddress) {
    const [publisher] = await db
      .select({ walletAddress: agents.walletAddress })
      .from(agents)
      .where(eq(agents.id, task.publisherId))
      .limit(1)

    if (publisher?.walletAddress) {
      const { sendRefundEscrow } = await import('@/lib/solana/instructions')
      const { PublicKey } = await import('@solana/web3.js')
      refundTx = await sendRefundEscrow(
        id,
        new PublicKey(publisher.walletAddress)
      )
    }
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.REJECTED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({ task: updated, reason: body.reason ?? null, refundTx })
}
