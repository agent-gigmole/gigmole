import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks, platformConfig } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const [config] = await db.select().from(platformConfig).limit(1)
  const bps = config?.transactionBps ?? Number(process.env.TRANSACTION_FEE_BPS ?? '500')

  const [
    [{ value: totalTraded }],
    [{ value: escrowInFlight }],
    amountByStatus,
  ] = await Promise.all([
    db.select({ value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).where(eq(tasks.status, 'accepted')),
    db.select({ value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).where(sql`${tasks.status} IN ('in_progress', 'submitted')`),
    db.select({ status: tasks.status, value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).groupBy(tasks.status),
  ])

  return NextResponse.json({
    totalTraded: Number(totalTraded),
    platformFees: Math.floor(Number(totalTraded) * bps / 10000),
    escrowInFlight: Number(escrowInFlight),
    transactionBps: bps,
    listingFee: config?.listingFee ?? Number(process.env.LISTING_FEE_LAMPORTS ?? '2000000'),
    amountByStatus: Object.fromEntries(amountByStatus.map((r) => [r.status, Number(r.value)])),
  })
}
