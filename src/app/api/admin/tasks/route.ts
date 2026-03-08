import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const status = url.searchParams.get('status')

  const where = status ? eq(tasks.status, status as any) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(tasks).where(where).orderBy(desc(tasks.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(tasks).where(where),
  ])

  return NextResponse.json({ tasks: rows, total, page, limit })
}
