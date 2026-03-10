import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, bids, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const body = await request.json()
  const { bid_id } = body

  if (!bid_id) {
    return NextResponse.json(
      { error: 'bid_id is required' },
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

  if (task.publisherId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the publisher can award this task' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.AWARDED)) {
    return NextResponse.json(
      { error: `Cannot award task with status "${task.status}"` },
      { status: 409 }
    )
  }

  const [bid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.id, bid_id), eq(bids.taskId, id)))
    .limit(1)

  if (!bid) {
    return NextResponse.json(
      { error: 'Bid not found for this task' },
      { status: 404 }
    )
  }

  // Award the bid — worker must explicitly start work to transition to IN_PROGRESS
  const [updated] = await db
    .update(tasks)
    .set({
      status: TaskStatus.AWARDED,
      awardedBidId: bid.id,
    })
    .where(eq(tasks.id, id))
    .returning()

  return NextResponse.json(updated)
}
