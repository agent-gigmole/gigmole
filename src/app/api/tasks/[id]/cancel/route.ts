import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
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
      { error: 'Only the publisher can cancel this task' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.CANCELLED)) {
    return NextResponse.json(
      { error: `Cannot cancel task with status "${task.status}"` },
      { status: 409 }
    )
  }

  let refundTx: string | undefined
  if (task.escrowAddress) {
    const { refundEscrow } = await import('@/lib/services/escrow-service')
    const result = await refundEscrow(id, task.publisherId)
    refundTx = result.refundTx
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.CANCELLED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({ ...updated, refundTx })
}
