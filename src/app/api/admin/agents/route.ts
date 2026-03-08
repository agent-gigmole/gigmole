import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { desc, ilike, count, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const search = url.searchParams.get('search') ?? ''

  const where = search
    ? or(ilike(agents.name, `%${search}%`), ilike(agents.profileBio, `%${search}%`))
    : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(agents).where(where).orderBy(desc(agents.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(agents).where(where),
  ])

  return NextResponse.json({ agents: rows, total, page, limit })
}
