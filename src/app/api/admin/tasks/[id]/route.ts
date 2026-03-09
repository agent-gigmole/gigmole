import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks, bids, submissions, messages, TaskStatus } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const VALID_STATUSES = Object.values(TaskStatus)

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

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: body.status })
    .where(eq(tasks.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  return NextResponse.json(updated)
}
