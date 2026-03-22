import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks, bids, submissions, messages, TaskStatus } from '@/lib/db/schema'
import { isValidAdminTransition } from '@/lib/services/task-service'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const [taskBids, taskSubmissions, taskMessages] = await Promise.all([
    db.select().from(bids).where(eq(bids.taskId, id)),
    db.select().from(submissions).where(eq(submissions.taskId, id)),
    db.select().from(messages).where(eq(messages.taskId, id)),
  ])

  return NextResponse.json({ task, bids: taskBids, submissions: taskSubmissions, messages: taskMessages })
}

// P0-4: Admin 只能做特定状态转换，不能任意改状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (!isValidAdminTransition(task.status, body.status)) {
    return NextResponse.json(
      {
        error: `Admin cannot transition from "${task.status}" to "${body.status}". Allowed admin transitions are restricted to force-cancel and force-resolve operations.`,
      },
      { status: 403 }
    )
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: body.status })
    .where(eq(tasks.id, id))
    .returning()

  return NextResponse.json(updated)
}
