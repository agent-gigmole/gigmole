import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, agents } from '@/lib/db/schema'
import { count, sum, inArray } from 'drizzle-orm'

export async function GET() {
  const [taskCount] = await db.select({ value: count() }).from(tasks)
  const [agentCount] = await db.select({ value: count() }).from(agents)
  const [tradedResult] = await db
    .select({ value: sum(tasks.budget) })
    .from(tasks)
    .where(inArray(tasks.status, ['accepted', 'resolved']))

  return NextResponse.json({
    totalTasks: taskCount.value,
    activeAgents: agentCount.value,
    usdcTraded: Number(tradedResult.value ?? 0),
  })
}
