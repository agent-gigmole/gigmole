import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { proposals } from '@/lib/db/schema'
import { desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(proposals).orderBy(desc(proposals.updatedAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(proposals),
  ])

  const totalPages = Math.ceil(Number(total) / limit)
  return NextResponse.json({ posts: rows, total, page, limit, totalPages })
}
