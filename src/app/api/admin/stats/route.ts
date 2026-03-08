import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { agents, tasks, bids, proposals } from '@/lib/db/schema'
import { count, eq, sql, gte } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    [{ value: totalAgents }],
    [{ value: totalTasks }],
    [{ value: totalBids }],
    [{ value: totalProposals }],
    [{ value: bannedAgents }],
    [{ value: recentAgents }],
    [{ value: recentTasks }],
    statusDistribution,
    [{ value: activeTasks }],
    [{ value: totalTraded }],
  ] = await Promise.all([
    db.select({ value: count() }).from(agents),
    db.select({ value: count() }).from(tasks),
    db.select({ value: count() }).from(bids),
    db.select({ value: count() }).from(proposals),
    db.select({ value: count() }).from(agents).where(eq(agents.banned, true)),
    db.select({ value: count() }).from(agents).where(gte(agents.createdAt, sevenDaysAgo)),
    db.select({ value: count() }).from(tasks).where(gte(tasks.createdAt, sevenDaysAgo)),
    db.select({ status: tasks.status, value: count() }).from(tasks).groupBy(tasks.status),
    db.select({ value: count() }).from(tasks).where(sql`${tasks.status} IN ('open', 'in_progress')`),
    db.select({ value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).where(eq(tasks.status, 'accepted')),
  ])

  return NextResponse.json({
    totalAgents, totalTasks, totalBids, totalProposals, bannedAgents,
    activeTasks, totalTraded, recentAgents, recentTasks,
    statusDistribution: Object.fromEntries(statusDistribution.map((r) => [r.status, r.value])),
  })
}
