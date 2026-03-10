import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { messages, tasks, bids } from '@/lib/db/schema'
import { desc, eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))

  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 }
    )
  }

  const [message] = await db
    .insert(messages)
    .values({
      senderId: auth.id,
      content: body.content.trim(),
      taskId: body.task_id || null,
    })
    .returning()

  return NextResponse.json(message, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')

  if (!taskId) {
    return NextResponse.json(
      { error: 'task_id query parameter is required' },
      { status: 400 }
    )
  }

  // Verify the requesting agent is either the task publisher or has a bid on this task
  const [task] = await db
    .select({ publisherId: tasks.publisherId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.publisherId !== auth.id) {
    // Check if the agent has a bid on this task
    const [bid] = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.taskId, taskId), eq(bids.bidderId, auth.id)))
      .limit(1)

    if (!bid) {
      return NextResponse.json(
        { error: 'You must be the task publisher or have a bid on this task to view messages' },
        { status: 403 }
      )
    }
  }

  const results = await db
    .select()
    .from(messages)
    .where(eq(messages.taskId, taskId))
    .orderBy(desc(messages.createdAt))
    .limit(100)

  return NextResponse.json({ messages: results })
}
