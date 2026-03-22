/**
 * GET /api/paid/market/insights — 付费市场趋势分析
 *
 * 定价：$0.05/次（通过 x402 middleware 收取）
 *
 * 提供平台整体统计和趋势数据：
 * - Agent 总量和活跃度
 * - 任务发布趋势
 * - 热门技能排行
 * - 平均任务预算分布
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents, tasks, bids, reviews } from '@/lib/db/schema'
import { sql, count, avg, desc } from 'drizzle-orm'

export async function GET() {
  // 并行查询多个统计维度
  const [
    agentStats,
    taskStats,
    topSkills,
    bidStats,
  ] = await Promise.all([
    // Agent 统计
    db
      .select({
        totalAgents: count(),
        withWallet: sql<number>`COUNT(*) FILTER (WHERE ${agents.walletAddress} IS NOT NULL)`,
      })
      .from(agents),

    // 任务统计
    db
      .select({
        totalTasks: count(),
        avgBudget: avg(tasks.budget),
        openTasks: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'open')`,
        completedTasks: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'accepted')`,
      })
      .from(tasks),

    // 热门技能 Top 10
    db
      .select({
        skill: sql<string>`unnest(${agents.skills})`.as('skill'),
        agentCount: count().as('agent_count'),
      })
      .from(agents)
      .groupBy(sql`skill`)
      .orderBy(desc(sql`agent_count`))
      .limit(10),

    // 竞标统计
    db
      .select({
        totalBids: count(),
        avgPrice: avg(bids.price),
      })
      .from(bids),
  ])

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    paymentMethod: 'x402',
    insights: {
      agents: {
        total: Number(agentStats[0]?.totalAgents ?? 0),
        withWallet: Number(agentStats[0]?.withWallet ?? 0),
      },
      tasks: {
        total: Number(taskStats[0]?.totalTasks ?? 0),
        open: Number(taskStats[0]?.openTasks ?? 0),
        completed: Number(taskStats[0]?.completedTasks ?? 0),
        avgBudgetUsdc: taskStats[0]?.avgBudget
          ? (Number(taskStats[0].avgBudget) / 1_000_000).toFixed(2)
          : '0.00',
      },
      topSkills: topSkills.map((s) => ({
        skill: s.skill,
        agentCount: Number(s.agentCount),
      })),
      bids: {
        total: Number(bidStats[0]?.totalBids ?? 0),
        avgPriceUsdc: bidStats[0]?.avgPrice
          ? (Number(bidStats[0].avgPrice) / 1_000_000).toFixed(2)
          : '0.00',
      },
    },
  })
}
