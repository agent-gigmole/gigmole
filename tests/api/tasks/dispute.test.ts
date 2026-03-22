import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSetReturning = vi.fn()
const mockSet = vi.fn().mockReturnValue({
  where: vi.fn().mockReturnValue({ returning: mockSetReturning }),
})
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

const mockLimit = vi.fn()
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'worker-uuid',
    name: 'Worker',
    walletAddress: 'WorkerWallet123',
  }),
}))

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
}))

import { POST } from '@/app/api/tasks/[id]/dispute/route'

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/tasks/task-uuid/dispute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_worker',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/tasks/[id]/dispute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows awarded worker to dispute within the window', async () => {
    const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
    // Task lookup
    mockLimit
      .mockResolvedValueOnce([{
        id: 'task-uuid',
        publisherId: 'publisher-uuid',
        status: 'rejected',
        awardedBidId: 'bid-uuid',
        disputeDeadline: futureDeadline,
      }])
      // Bid lookup
      .mockResolvedValueOnce([{
        id: 'bid-uuid',
        taskId: 'task-uuid',
        bidderId: 'worker-uuid',
      }])

    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'disputed',
    }])

    const response = await POST(makeRequest({ reason: 'Work was complete' }), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.task.status).toBe('disputed')
    expect(data.message).toMatch(/dispute/i)
  })

  it('returns 404 when task not found', async () => {
    mockLimit.mockResolvedValueOnce([])

    const response = await POST(makeRequest({ reason: 'test' }), { params: paramsPromise })
    expect(response.status).toBe(404)
  })

  it('returns 400 when no awarded bid exists', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'rejected',
      awardedBidId: null,
      disputeDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    }])

    const response = await POST(makeRequest({ reason: 'test' }), { params: paramsPromise })
    expect(response.status).toBe(400)
  })

  it('returns 403 when caller is not the awarded worker', async () => {
    mockLimit
      .mockResolvedValueOnce([{
        id: 'task-uuid',
        publisherId: 'publisher-uuid',
        status: 'rejected',
        awardedBidId: 'bid-uuid',
        disputeDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      }])
      .mockResolvedValueOnce([{
        id: 'bid-uuid',
        taskId: 'task-uuid',
        bidderId: 'other-worker-uuid', // not the caller
      }])

    const response = await POST(makeRequest({ reason: 'test' }), { params: paramsPromise })
    expect(response.status).toBe(403)
  })

  it('returns 410 when dispute window has expired', async () => {
    const pastDeadline = new Date(Date.now() - 1000) // already past
    mockLimit
      .mockResolvedValueOnce([{
        id: 'task-uuid',
        publisherId: 'publisher-uuid',
        status: 'rejected',
        awardedBidId: 'bid-uuid',
        disputeDeadline: pastDeadline,
      }])
      .mockResolvedValueOnce([{
        id: 'bid-uuid',
        taskId: 'task-uuid',
        bidderId: 'worker-uuid',
      }])

    const response = await POST(makeRequest({ reason: 'test' }), { params: paramsPromise })
    expect(response.status).toBe(410)
  })

  it('returns 409 on concurrent status change', async () => {
    mockLimit
      .mockResolvedValueOnce([{
        id: 'task-uuid',
        publisherId: 'publisher-uuid',
        status: 'rejected',
        awardedBidId: 'bid-uuid',
        disputeDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      }])
      .mockResolvedValueOnce([{
        id: 'bid-uuid',
        taskId: 'task-uuid',
        bidderId: 'worker-uuid',
      }])

    // Update returns empty (concurrent change)
    mockSetReturning.mockResolvedValue([])

    const response = await POST(makeRequest({ reason: 'test' }), { params: paramsPromise })
    expect(response.status).toBe(409)
  })
})
