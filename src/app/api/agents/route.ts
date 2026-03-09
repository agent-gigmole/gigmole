import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents, reviews } from '@/lib/db/schema'
import { eq, and, sql, desc, ilike, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const skill = url.searchParams.get('skill')
  const q = url.searchParams.get('q')
  const sort = url.searchParams.get('sort') ?? 'newest'

  // Build where conditions: only non-banned agents
  const conditions = [eq(agents.banned, false)]

  if (skill) {
    conditions.push(sql`${skill} = ANY(${agents.skills})`)
  }

  if (q) {
    conditions.push(ilike(agents.name, `%${q}%`))
  }

  const whereClause = and(...conditions)

  // Reputation subquery
  const reputationSq = db
    .select({
      revieweeId: reviews.revieweeId,
      totalCompleted: count().as('total_completed'),
      successRate: sql<number>`
        CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE ${reviews.rating} >= 3)::numeric / COUNT(*)::numeric, 2)
        END
      `.as('success_rate'),
      avgSatisfaction: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 2), 0)`.as('avg_satisfaction'),
    })
    .from(reviews)
    .groupBy(reviews.revieweeId)
    .as('reputation')

  // Determine sort order
  let orderBy
  switch (sort) {
    case 'most_completed':
      orderBy = desc(sql`COALESCE(${reputationSq.totalCompleted}, 0)`)
      break
    case 'highest_rated':
      orderBy = desc(sql`COALESCE(${reputationSq.avgSatisfaction}, 0)`)
      break
    case 'newest':
    default:
      orderBy = desc(agents.createdAt)
      break
  }

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: agents.id,
        name: agents.name,
        walletAddress: agents.walletAddress,
        profileBio: agents.profileBio,
        skills: agents.skills,
        createdAt: agents.createdAt,
        totalCompleted: sql<number>`COALESCE(${reputationSq.totalCompleted}, 0)`,
        successRate: sql<number>`COALESCE(${reputationSq.successRate}, 0)`,
        avgSatisfaction: sql<number>`COALESCE(${reputationSq.avgSatisfaction}, 0)`,
      })
      .from(agents)
      .leftJoin(reputationSq, eq(agents.id, reputationSq.revieweeId))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(agents).where(whereClause),
  ])

  const agentList = rows.map((row) => ({
    id: row.id,
    name: row.name,
    walletAddress: row.walletAddress,
    profileBio: row.profileBio,
    skills: row.skills,
    createdAt: row.createdAt,
    reputation: {
      totalCompleted: Number(row.totalCompleted),
      successRate: Number(row.successRate),
      avgSatisfaction: Number(row.avgSatisfaction),
    },
  }))

  return NextResponse.json({ agents: agentList, total, page, limit })
}
