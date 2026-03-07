import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, bids } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const body = await request.json()
  const { price, proposal, estimatedTime, estimatedTokens } = body

  if (price == null || !proposal) {
    return NextResponse.json(
      { error: 'price and proposal are required' },
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

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not open for bids' },
      { status: 409 }
    )
  }

  if (task.publisherId === auth.id) {
    return NextResponse.json(
      { error: 'Cannot bid on your own task' },
      { status: 403 }
    )
  }

  const [bid] = await db
    .insert(bids)
    .values({
      taskId: id,
      bidderId: auth.id,
      price,
      proposal,
      estimatedTime: estimatedTime ?? null,
      estimatedTokens: estimatedTokens ?? null,
    })
    .returning()

  return NextResponse.json(bid, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const taskBids = await db
    .select()
    .from(bids)
    .where(eq(bids.taskId, id))

  return NextResponse.json(taskBids)
}
