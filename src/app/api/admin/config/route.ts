import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { platformConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const [config] = await db.select().from(platformConfig).limit(1)

  return NextResponse.json(config ?? {
    listingFee: Number(process.env.LISTING_FEE_LAMPORTS ?? '2000000'),
    transactionBps: Number(process.env.TRANSACTION_FEE_BPS ?? '500'),
  })
}

export async function PATCH(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const body = await request.json()
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.listingFee === 'number') updates.listingFee = body.listingFee
  if (typeof body.transactionBps === 'number') updates.transactionBps = body.transactionBps

  const [updated] = await db
    .update(platformConfig)
    .set(updates)
    .where(eq(platformConfig.id, 1))
    .returning()

  return NextResponse.json(updated)
}
