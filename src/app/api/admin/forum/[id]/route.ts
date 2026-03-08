import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { proposals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  if (body.status !== 'closed') {
    return NextResponse.json({ error: 'Only status "closed" is supported' }, { status: 400 })
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: 'closed' })
    .where(eq(proposals.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

  return NextResponse.json(updated)
}
