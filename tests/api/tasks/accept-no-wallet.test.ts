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

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
}))

const mockReleaseEscrow = vi.fn()
vi.mock('@/lib/services/escrow-service', () => ({
  releaseEscrow: (...args: unknown[]) => mockReleaseEscrow(...args),
}))

import { POST } from '@/app/api/tasks/[id]/accept/route'

const taskWithEscrow = {
  id: 'task-uuid',
  publisherId: 'publisher-uuid',
  title: 'Test Task',
  description: 'Test',
  budget: 5000000,
  status: 'submitted',
  tags: [],
  escrowAddress: 'EscrowPdaAddr',
  awardedBidId: 'bid-uuid',
  releaseTx: null,
  createdAt: new Date(),
}

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

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

describe('POST /api/tasks/[id]/accept — worker without wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts task but skips escrow release when worker has no wallet (walletWarning)', async () => {
    // First select: task lookup returns task with escrow
    // First update (releasing): returns the releasing state
    // releaseEscrow returns walletWarning
    // Second update (rollback to submitted)
    mockLimit.mockResolvedValueOnce([taskWithEscrow])
    // First update set (releasing)
    mockSetReturning
      .mockResolvedValueOnce([{ ...taskWithEscrow, status: 'releasing' }])

    mockReleaseEscrow.mockResolvedValue({ walletWarning: 'Worker needs to bind a wallet to receive payment' })

    // Second update set (rollback to submitted due to walletWarning)
    mockSetReturning
      .mockResolvedValueOnce([{ ...taskWithEscrow, status: 'submitted' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.walletWarning).toMatch(/bind a wallet/)
  })

  it('accepts task and calls escrow release when worker has wallet', async () => {
    mockLimit.mockResolvedValueOnce([taskWithEscrow])
    // First update: releasing
    mockSetReturning
      .mockResolvedValueOnce([{ ...taskWithEscrow, status: 'releasing' }])

    mockReleaseEscrow.mockResolvedValue({ releaseTx: 'releaseTxSig' })

    // Second update: accepted
    mockSetReturning
      .mockResolvedValueOnce([{ ...taskWithEscrow, status: 'accepted', releaseTx: 'releaseTxSig' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.releaseTx).toBe('releaseTxSig')
    expect(mockReleaseEscrow).toHaveBeenCalled()
  })

  it('accepts task without escrow when no escrowAddress on task', async () => {
    const taskNoEscrow = { ...taskWithEscrow, escrowAddress: null, awardedBidId: null }
    mockLimit.mockResolvedValue([taskNoEscrow])
    mockSetReturning.mockResolvedValue([{ ...taskNoEscrow, status: 'accepted' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('accepted')
    expect(data.releaseTx).toBeUndefined()
    expect(mockReleaseEscrow).not.toHaveBeenCalled()
  })
})
