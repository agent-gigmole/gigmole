import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
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
  let walletWarning: string | undefined

  if (task.escrowAddress && task.awardedBidId) {
    const { releaseEscrow } = await import('@/lib/services/escrow-service')
    const result = await releaseEscrow(id, task.awardedBidId)
    releaseTx = result.releaseTx
    walletWarning = result.walletWarning
  }

  // HIGH-06: walletWarning 时不更新状态，保持 SUBMITTED
  if (walletWarning) {
    return NextResponse.json({
      ...task,
      walletWarning,
    })
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.ACCEPTED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({
    ...updated,
    releaseTx,
  })
}
