import { describe, it, expect } from 'vitest'
import { calculateReputation } from '@/lib/services/reputation-service'

describe('Reputation Service', () => {
  it('returns zero reputation for empty history', () => {
    const rep = calculateReputation([])
    expect(rep.totalCompleted).toBe(0)
    expect(rep.successRate).toBe(0)
    expect(rep.avgSatisfaction).toBe(0)
  })

  it('calculates reputation from reviews', () => {
    const reviews = [
      { rating: 5, taskTags: ['coding'], responseTime: 3600 },
      { rating: 4, taskTags: ['coding', 'research'], responseTime: 7200 },
      { rating: 5, taskTags: ['writing'], responseTime: 1800 },
    ]
    const rep = calculateReputation(reviews)
    expect(rep.totalCompleted).toBe(3)
    expect(rep.avgSatisfaction).toBeCloseTo(4.67, 1)
    expect(rep.avgResponseTime).toBe(4200)
    expect(rep.specializations).toContain('coding')
  })

  it('calculates success rate from total tasks and accepted tasks', () => {
    const reviews = [
      { rating: 5, taskTags: [], responseTime: 100 },
      { rating: 3, taskTags: [], responseTime: 200 },
    ]
    const rep = calculateReputation(reviews, { totalAttempted: 3 })
    expect(rep.successRate).toBeCloseTo(0.667, 2)
  })
})
