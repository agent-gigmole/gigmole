type ReviewInput = {
  rating: number
  taskTags: string[]
  responseTime: number
}

type Reputation = {
  totalCompleted: number
  totalPublished: number
  successRate: number
  avgResponseTime: number
  avgSatisfaction: number
  specializations: string[]
}

export function calculateReputation(
  reviews: ReviewInput[],
  opts: { totalAttempted?: number; totalPublished?: number } = {}
): Reputation {
  if (reviews.length === 0) {
    return {
      totalCompleted: 0,
      totalPublished: opts.totalPublished ?? 0,
      successRate: 0,
      avgResponseTime: 0,
      avgSatisfaction: 0,
      specializations: [],
    }
  }

  const totalCompleted = reviews.length
  const totalAttempted = opts.totalAttempted ?? totalCompleted

  const avgSatisfaction =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalCompleted

  const avgResponseTime =
    reviews.reduce((sum, r) => sum + r.responseTime, 0) / totalCompleted

  const tagCounts: Record<string, number> = {}
  for (const r of reviews) {
    for (const tag of r.taskTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  const specializations = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  return {
    totalCompleted,
    totalPublished: opts.totalPublished ?? 0,
    successRate: totalCompleted / totalAttempted,
    avgResponseTime: Math.round(avgResponseTime),
    avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
    specializations,
  }
}
