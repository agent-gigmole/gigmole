import { describe, it, expect } from 'vitest'

// Test that all route modules export the expected HTTP methods
describe('Task Lifecycle - Route Exports', () => {
  it('register route exports POST', async () => {
    const mod = await import('@/app/api/agents/register/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('agent profile route exports GET', async () => {
    const mod = await import('@/app/api/agents/[id]/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('bind-wallet route exports POST', async () => {
    const mod = await import('@/app/api/agents/bind-wallet/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('tasks route exports POST and GET', async () => {
    const mod = await import('@/app/api/tasks/route')
    expect(typeof mod.POST).toBe('function')
    expect(typeof mod.GET).toBe('function')
  })

  it('task detail route exports GET', async () => {
    const mod = await import('@/app/api/tasks/[id]/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('task cancel route exports PATCH', async () => {
    const mod = await import('@/app/api/tasks/[id]/cancel/route')
    expect(typeof mod.PATCH).toBe('function')
  })

  it('bids route exports POST and GET', async () => {
    const mod = await import('@/app/api/tasks/[id]/bids/route')
    expect(typeof mod.POST).toBe('function')
    expect(typeof mod.GET).toBe('function')
  })

  it('award route exports POST', async () => {
    const mod = await import('@/app/api/tasks/[id]/award/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('submit route exports POST', async () => {
    const mod = await import('@/app/api/tasks/[id]/submit/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('accept route exports POST', async () => {
    const mod = await import('@/app/api/tasks/[id]/accept/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('reject route exports POST', async () => {
    const mod = await import('@/app/api/tasks/[id]/reject/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('task reviews route exports POST', async () => {
    const mod = await import('@/app/api/tasks/[id]/reviews/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('agent reviews route exports GET', async () => {
    const mod = await import('@/app/api/agents/[id]/reviews/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('messages route exports POST and GET', async () => {
    const mod = await import('@/app/api/messages/route')
    expect(typeof mod.POST).toBe('function')
    expect(typeof mod.GET).toBe('function')
  })
})

// Test the state machine covers the full lifecycle
import { isValidTransition, TaskStatus } from '@/lib/services/task-service'

describe('Task Lifecycle - State Machine Coverage', () => {
  it('supports the complete happy path', () => {
    // OPEN -> AWARDED -> IN_PROGRESS -> SUBMITTED -> RELEASING -> ACCEPTED
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.AWARDED)).toBe(true)
    expect(isValidTransition(TaskStatus.AWARDED, TaskStatus.IN_PROGRESS)).toBe(true)
    expect(isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED)).toBe(true)
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.RELEASING)).toBe(true)
    expect(isValidTransition(TaskStatus.RELEASING, TaskStatus.ACCEPTED)).toBe(true)
  })

  it('supports the rejection + resubmit path', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.REJECTED)).toBe(true)
    expect(isValidTransition(TaskStatus.REJECTED, TaskStatus.SUBMITTED)).toBe(true)
  })

  it('supports the dispute path', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.DISPUTED)).toBe(true)
    expect(isValidTransition(TaskStatus.REJECTED, TaskStatus.DISPUTED)).toBe(true)
    expect(isValidTransition(TaskStatus.DISPUTED, TaskStatus.RESOLVED)).toBe(true)
  })

  it('supports cancellation', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.CANCELLED)).toBe(true)
  })
})

// Test reputation calculation end-to-end
import { calculateReputation } from '@/lib/services/reputation-service'

describe('Task Lifecycle - Reputation Integration', () => {
  it('builds reputation from completed tasks', () => {
    const reviews = [
      { rating: 5, taskTags: ['coding'], responseTime: 1800 },
      { rating: 4, taskTags: ['coding', 'research'], responseTime: 3600 },
      { rating: 5, taskTags: ['writing'], responseTime: 900 },
      { rating: 3, taskTags: ['data'], responseTime: 7200 },
    ]

    const rep = calculateReputation(reviews, { totalAttempted: 5 })

    expect(rep.totalCompleted).toBe(4)
    expect(rep.successRate).toBe(0.8)
    expect(rep.avgSatisfaction).toBe(4.25)
    expect(rep.specializations[0]).toBe('coding')
    expect(rep.specializations).toContain('coding')
  })
})
