import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reviews, bids, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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

  // Validate reviewee is task publisher or awarded bidder
  let validReviewee = false
  if (body.reviewee_id === task.publisherId) {
    validReviewee = true
  } else if (task.awardedBidId) {
    const [awardedBid] = await db
      .select({ bidderId: bids.bidderId })
      .from(bids)
      .where(eq(bids.id, task.awardedBidId))
      .limit(1)
    if (awardedBid && awardedBid.bidderId === body.reviewee_id) {
      validReviewee = true
    }
  }
  if (!validReviewee) {
    return NextResponse.json(
      { error: 'reviewee_id must be the task publisher or awarded bidder' },
      { status: 400 }
    )
  }

  // Prevent duplicate reviews (same taskId + reviewerId + revieweeId)
  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.taskId, taskId),
        eq(reviews.reviewerId, auth.id),
        eq(reviews.revieweeId, body.reviewee_id)
      )
    )
    .limit(1)
  if (existingReview) {
    return NextResponse.json(
      { error: 'You have already reviewed this participant for this task' },
      { status: 409 }
    )
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
