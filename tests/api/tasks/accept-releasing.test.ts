import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use a chainable mock factory that rebuilds on each call
const mockSetReturning = vi.fn()
const mockSetWhere = vi.fn().mockReturnValue({ returning: mockSetReturning })
const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere })
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

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
}))

const mockReleaseEscrow = vi.fn()
vi.mock('@/lib/services/escrow-service', () => ({
  releaseEscrow: (...args: unknown[]) => mockReleaseEscrow(...args),
}))

import { POST } from '@/app/api/tasks/[id]/accept/route'

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

function makeRequest() {
  return new Request('http://localhost/api/tasks/task-uuid/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify({}),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/tasks/[id]/accept — RELEASING state flow', () => {
  beforeEach(() => {
    mockSetReturning.mockReset()
    mockLimit.mockReset()
    mockReleaseEscrow.mockReset()
  })

  it('goes through submitted → releasing → accepted on successful escrow release', async () => {
    const task = {
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'submitted',
      escrowAddress: 'EscrowPdaAddr',
      awardedBidId: 'bid-uuid',
      releaseTx: null,
    }

    mockLimit.mockResolvedValueOnce([task])
    // First update: set releasing
    mockSetReturning
      .mockResolvedValueOnce([{ ...task, status: 'releasing' }])

    mockReleaseEscrow.mockResolvedValue({ releaseTx: 'txSig123' })

    // Second update: set accepted + releaseTx
    mockSetReturning
      .mockResolvedValueOnce([{ ...task, status: 'accepted', releaseTx: 'txSig123' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('accepted')
    expect(data.releaseTx).toBe('txSig123')
  })

  it('rolls back to submitted when escrow release fails on-chain', async () => {
    const task = {
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'submitted',
      escrowAddress: 'EscrowPdaAddr',
      awardedBidId: 'bid-uuid',
      releaseTx: null,
    }

    mockLimit.mockResolvedValueOnce([task])
    // First update: set releasing succeeds
    mockSetReturning.mockResolvedValueOnce([{ ...task, status: 'releasing' }])

    mockReleaseEscrow.mockRejectedValue(new Error('Solana RPC error'))

    // Rollback update: set submitted (in the catch block)
    mockSetReturning.mockResolvedValueOnce([{ ...task, status: 'submitted' }])

    const response = await POST(makeRequest(), { params: paramsPromise })

    expect(response.status).toBe(502)
    const data = await response.json()
    expect(data.error).toMatch(/escrow release failed/i)
  })

  it('handles idempotent retry: releasing + releaseTx already set', async () => {
    const task = {
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'releasing',
      escrowAddress: 'EscrowPdaAddr',
      awardedBidId: 'bid-uuid',
      releaseTx: 'existingTxSig',
    }

    mockLimit.mockResolvedValueOnce([task])
    // Idempotent path: directly set accepted
    mockSetReturning.mockResolvedValueOnce([{ ...task, status: 'accepted' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.releaseTx).toBe('existingTxSig')
    // Should NOT call releaseEscrow again
    expect(mockReleaseEscrow).not.toHaveBeenCalled()
  })

  it('returns 409 on concurrent status change during releasing', async () => {
    const task = {
      id: 'task-uuid',
      publisherId: 'publisher-uuid',
      status: 'submitted',
      escrowAddress: 'EscrowPdaAddr',
      awardedBidId: 'bid-uuid',
      releaseTx: null,
    }

    mockLimit.mockResolvedValueOnce([task])
    // CAS update for releasing returns empty — concurrent status change
    mockSetReturning.mockResolvedValueOnce([])

    const response = await POST(makeRequest(), { params: paramsPromise })

    // When the CAS releasing update returns empty, the route returns 409
    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toMatch(/concurrent/i)
  })
})
