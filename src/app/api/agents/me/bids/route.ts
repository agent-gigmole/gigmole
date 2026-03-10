import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { bids, tasks } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'

/**
 * GET /api/agents/me/bids
 * Returns bids where bidder_id = authenticated agent.
 * Uses Bearer token auth (for programmatic API clients).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
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
      .where(eq(bids.bidderId, auth.id))
      .orderBy(desc(bids.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(bids).where(eq(bids.bidderId, auth.id)),
  ])

  return NextResponse.json({ bids: rows, total, page, limit })
}
