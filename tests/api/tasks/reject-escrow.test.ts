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
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: '11111111111111111111111111111111',
  }),
}))

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
}))

import { POST } from '@/app/api/tasks/[id]/reject/route'

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/tasks/task-uuid/reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/tasks/[id]/reject (P0-3: no auto-refund)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets status to rejected with disputeDeadline (no refund)', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'agent-uuid',
      status: 'submitted',
      escrowAddress: 'EscrowPdaAddr',
    }])
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'rejected',
    }])

    const request = makeRequest({ reason: 'Incomplete' })
    const response = await POST(request, { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.disputeDeadline).toBeDefined()
    expect(data.message).toMatch(/72 hours/)
  })

  it('works when task has no escrowAddress', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'agent-uuid',
      status: 'submitted',
      escrowAddress: null,
    }])
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'rejected',
    }])

    const request = makeRequest({ reason: 'Bad work' })
    const response = await POST(request, { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.disputeDeadline).toBeDefined()
  })

  it('returns 403 when caller is not the publisher', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'other-agent-uuid',
      status: 'submitted',
      escrowAddress: null,
    }])

    const request = makeRequest({ reason: 'Bad work' })
    const response = await POST(request, { params: paramsPromise })

    expect(response.status).toBe(403)
  })

  it('returns 404 when task not found', async () => {
    mockLimit.mockResolvedValueOnce([])

    const request = makeRequest({ reason: 'Bad work' })
    const response = await POST(request, { params: paramsPromise })

    expect(response.status).toBe(404)
  })
})
