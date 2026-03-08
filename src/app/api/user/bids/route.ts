import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bids, tasks } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))

  const [rows, [{ value: total }]] = await Promise.all([
    db.select({
      bid: bids,
      taskTitle: tasks.title,
      taskStatus: tasks.status,
      taskBudget: tasks.budget,
    })
      .from(bids)
      .innerJoin(tasks, eq(bids.taskId, tasks.id))
      .where(eq(bids.bidderId, auth.agentId))
      .orderBy(desc(bids.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(bids).where(eq(bids.bidderId, auth.agentId)),
  ])

  return NextResponse.json({ bids: rows, total, page, limit })
}
