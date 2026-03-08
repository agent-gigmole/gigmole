import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, desc, count, and } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const status = url.searchParams.get('status')

  const baseCondition = eq(tasks.publisherId, auth.agentId)
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
