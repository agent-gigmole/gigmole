import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// P0-3: Refund 端点 — 争议窗口过后 publisher 可触发退款
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
      { error: 'Only the publisher can trigger refund' },
      { status: 403 }
    )
  }

  // 只有 rejected 状态且争议窗口已过才可 refund
  if (task.status !== TaskStatus.REJECTED) {
    return NextResponse.json(
      { error: `Cannot refund task with status "${task.status}". Task must be in rejected status.` },
      { status: 409 }
    )
  }

  // 检查争议窗口是否已过
  if (task.disputeDeadline && new Date() < task.disputeDeadline) {
    return NextResponse.json(
      {
        error: 'Dispute window still active. Refund available after deadline.',
        disputeDeadline: task.disputeDeadline.toISOString(),
      },
      { status: 423 } // Locked
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
    .where(and(eq(tasks.id, id), eq(tasks.status, TaskStatus.REJECTED)))
    .returning()

  return NextResponse.json({
    task: updated,
    refundTx,
    message: 'Refund processed successfully.',
  })
}
