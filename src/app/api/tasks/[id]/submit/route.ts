import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, submissions, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await request.json()

  if (!body.content) {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 }
    )
  }

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!isValidTransition(task.status, TaskStatus.SUBMITTED)) {
    return NextResponse.json(
      { error: `Cannot submit deliverable for task with status "${task.status}"` },
      { status: 409 }
    )
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      taskId: id,
      content: body.content,
      tokensUsed: body.tokens_used ?? null,
    })
    .returning()

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.SUBMITTED })
    .where(eq(tasks.id, id))
    .returning()

  return NextResponse.json({ task: updated, submission }, { status: 201 })
}
