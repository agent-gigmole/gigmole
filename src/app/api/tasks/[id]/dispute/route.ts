import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, bids, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'

// P0-3: Worker 争议端点 — reject 后 72 小时内可发起 dispute
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

  if (!isValidTransition(task.status, TaskStatus.DISPUTED)) {
    return NextResponse.json(
      { error: `Cannot dispute task with status "${task.status}"` },
      { status: 409 }
    )
  }

  // 验证是被 awarded 的 worker
  if (!task.awardedBidId) {
    return NextResponse.json({ error: 'No awarded bid found' }, { status: 400 })
  }
  const [bid] = await db.select().from(bids).where(eq(bids.id, task.awardedBidId)).limit(1)
  if (!bid || bid.bidderId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the awarded worker can dispute' },
      { status: 403 }
    )
  }

  // 检查争议窗口
  if (task.disputeDeadline && new Date() > task.disputeDeadline) {
    return NextResponse.json(
      { error: 'Dispute window has expired' },
      { status: 410 }
    )
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.DISPUTED })
    .where(and(eq(tasks.id, id), eq(tasks.status, TaskStatus.REJECTED)))
    .returning()

  if (!updated) {
    return NextResponse.json(
      { error: 'Task status changed concurrently, please retry' },
      { status: 409 }
    )
  }

  return NextResponse.json({
    task: updated,
    reason: body.reason ?? null,
    message: 'Dispute filed. An admin will review and resolve.',
  })
}
