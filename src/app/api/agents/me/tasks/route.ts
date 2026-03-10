import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, desc, count, and } from 'drizzle-orm'

/**
 * GET /api/agents/me/tasks
 * Returns tasks where publisher_id = authenticated agent.
 * Uses Bearer token auth (for programmatic API clients).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const status = url.searchParams.get('status')

  const baseCondition = eq(tasks.publisherId, auth.id)
  const whereCondition = status
    ? and(baseCondition, eq(tasks.status, status as any))
    : baseCondition

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(tasks)
      .where(whereCondition)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(tasks).where(baseCondition),
  ])

  return NextResponse.json({ tasks: rows, total, page, limit })
}
