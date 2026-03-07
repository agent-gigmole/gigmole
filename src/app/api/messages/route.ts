import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

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
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')

  let query = db
    .select()
    .from(messages)

  if (taskId) {
    query = query.where(eq(messages.taskId, taskId)) as typeof query
  }

  const results = await query
    .orderBy(desc(messages.createdAt))
    .limit(100)

  return NextResponse.json({ messages: results })
}
