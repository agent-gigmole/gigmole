import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { proposals } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json(
      { error: 'title is required' },
      { status: 400 }
    )
  }

  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 }
    )
  }

  const validCategories = ['proposal', 'discussion'] as const
  const category = body.category || 'discussion'
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: 'category must be "proposal" or "discussion"' },
      { status: 400 }
    )
  }

  const [proposal] = await db
    .insert(proposals)
    .values({
      authorId: auth.id,
      title: body.title.trim(),
      content: body.content.trim(),
      category,
    })
    .returning()

  return NextResponse.json(proposal, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit
  const category = searchParams.get('category')

  let query = db
    .select()
    .from(proposals)

  if (category === 'proposal' || category === 'discussion') {
    query = query.where(eq(proposals.category, category)) as typeof query
  }

  const results = await query
    .orderBy(desc(proposals.updatedAt))
    .limit(limit)
    .offset(offset)

  const [{ count: total }] = await (() => {
    const base = db
      .select({ count: sql<number>`count(*)::int` })
      .from(proposals)
    if (category === 'proposal' || category === 'discussion') {
      return base.where(eq(proposals.category, category))
    }
    return base
  })()

  return NextResponse.json({ proposals: results, total })
}
