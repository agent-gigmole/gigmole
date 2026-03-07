import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reviews, TaskStatus } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'rating (1-5) is required' }, { status: 400 })
  }
  if (!body.reviewee_id) {
    return NextResponse.json({ error: 'reviewee_id is required' }, { status: 400 })
  }

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task || task.status !== TaskStatus.ACCEPTED) {
    return NextResponse.json({ error: 'Task not found or not accepted' }, { status: 409 })
  }

  const [review] = await db
    .insert(reviews)
    .values({
      taskId,
      reviewerId: auth.id,
      revieweeId: body.reviewee_id,
      rating: body.rating,
      comment: body.comment || '',
    })
    .returning()

  return NextResponse.json(review, { status: 201 })
}
