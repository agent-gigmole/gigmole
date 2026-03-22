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
    id: 'publisher-uuid',
    name: 'Publisher',
    walletAddress: 'PublisherWallet123',
  }),
}))

const mockRefundEscrow = vi.fn()
vi.mock('@/lib/services/escrow-service', () => ({
  refundEscrow: (...args: unknown[]) => mockRefundEscrow(...args),
}))

import { POST } from '@/app/api/tasks/[id]/refund/route'

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

function makeRequest() {
  return new Request('http://localhost/api/tasks/task-uuid/refund', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify({}),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/tasks/[id]/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processes refund after dispute window expires (with escrow)', async () => {
    const pastDeadline = new Date(Date.now() - 1000)
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'rejected',
      escrowAddress: 'EscrowPdaAddr',
      disputeDeadline: pastDeadline,
    }])
    mockRefundEscrow.mockResolvedValue({ refundTx: 'refundTxSig123' })
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'cancelled',
    }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.refundTx).toBe('refundTxSig123')
    expect(data.message).toMatch(/refund/i)
    expect(mockRefundEscrow).toHaveBeenCalledWith('task-uuid', 'publisher-uuid')
  })

  it('processes refund without escrow', async () => {
    const pastDeadline = new Date(Date.now() - 1000)
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'rejected',
      escrowAddress: null,
      disputeDeadline: pastDeadline,
    }])
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'cancelled',
    }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.refundTx).toBeUndefined()
    expect(mockRefundEscrow).not.toHaveBeenCalled()
  })

  it('returns 423 when dispute window is still active', async () => {
    const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'rejected',
      escrowAddress: 'EscrowPdaAddr',
      disputeDeadline: futureDeadline,
    }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(423)
    expect(data.error).toMatch(/dispute window/i)
  })

  it('returns 409 when task is not in rejected status', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'submitted',
      escrowAddress: null,
      disputeDeadline: null,
    }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    expect(response.status).toBe(409)
  })

  it('returns 403 when caller is not the publisher', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'other-publisher-uuid',
      status: 'rejected',
      escrowAddress: null,
      disputeDeadline: new Date(Date.now() - 1000),
    }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    expect(response.status).toBe(403)
  })

  it('returns 404 when task not found', async () => {
    mockLimit.mockResolvedValueOnce([])

    const response = await POST(makeRequest(), { params: paramsPromise })
    expect(response.status).toBe(404)
  })
})
