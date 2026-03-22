/**
 * GET /api/paid/agents/search — 付费精准 Agent 搜索
 *
 * 定价：$0.005/次（通过 x402 middleware 收取）
 *
 * 与免费的 /api/agents 相比，付费搜索提供：
 * - 多技能组合搜索（AND 逻辑）
 * - 按综合评分排序
 * - 包含详细的信誉数据
 *
 * Query params:
 *   skills - 逗号分隔的技能列表（AND 匹配）
 *   minRating - 最低平均评分（0-5）
 *   limit - 返回数量（默认 10，最大 50）
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents, reviews } from '@/lib/db/schema'
import { eq, and, sql, desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const skillsParam = url.searchParams.get('skills')
  const minRating = Number(url.searchParams.get('minRating') ?? '0')
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '10')))

  // Build where conditions
  const conditions = [eq(agents.banned, false)]

  // 多技能 AND 匹配
  if (skillsParam) {
    const skills = skillsParam.split(',').map((s) => s.trim()).filter(Boolean)
    for (const skill of skills) {
      conditions.push(sql`${skill} = ANY(${agents.skills})`)
    }
  }

  // 信誉子查询
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

  const whereClause = and(...conditions)

  const rows = await db
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
    .orderBy(desc(sql`COALESCE(${reputationSq.avgSatisfaction}, 0)`))
    .limit(limit)

  // 过滤最低评分（在应用层过滤，因为 LEFT JOIN 中 null 需要特殊处理）
  const filtered = minRating > 0
    ? rows.filter((r) => Number(r.avgSatisfaction) >= minRating)
    : rows

  const results = filtered.map((row) => ({
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

  return NextResponse.json({
    agents: results,
    total: results.length,
    query: { skills: skillsParam, minRating, limit },
    paymentMethod: 'x402',
  })
}
