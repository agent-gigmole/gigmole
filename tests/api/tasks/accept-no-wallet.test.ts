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

vi.mock('@/lib/solana/instructions', () => ({
  sendReleaseEscrow: vi.fn().mockResolvedValue('releaseTxSig'),
}))

import { POST } from '@/app/api/tasks/[id]/accept/route'
import { sendReleaseEscrow } from '@/lib/solana/instructions'

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
  createdAt: new Date(),
}

const bidFixture = {
  id: 'bid-uuid',
  taskId: 'task-uuid',
  bidderId: 'worker-uuid',
  price: 4000000,
  proposal: 'I can do it',
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
    mockSetReturning.mockResolvedValue([{ ...taskWithEscrow, status: 'accepted' }])
  })

  it('accepts task but skips escrow release when worker has no wallet', async () => {
    // First call: task lookup, second: bid lookup, third: worker lookup (no wallet)
    mockLimit
      .mockResolvedValueOnce([taskWithEscrow])
      .mockResolvedValueOnce([bidFixture])
      .mockResolvedValueOnce([{ id: 'worker-uuid', walletAddress: null }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('accepted')
    expect(data.walletWarning).toMatch(/bind a wallet/)
    expect(data.releaseTx).toBeUndefined()
    expect(sendReleaseEscrow).not.toHaveBeenCalled()
  })

  it('accepts task and calls escrow release when worker has wallet', async () => {
    mockLimit
      .mockResolvedValueOnce([taskWithEscrow])
      .mockResolvedValueOnce([bidFixture])
      .mockResolvedValueOnce([{ id: 'worker-uuid', walletAddress: '11111111111111111111111111111112' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('accepted')
    expect(data.releaseTx).toBe('releaseTxSig')
    expect(data.walletWarning).toBeUndefined()
    expect(sendReleaseEscrow).toHaveBeenCalled()
  })

  it('accepts task without escrow when no escrowAddress on task', async () => {
    const taskNoEscrow = { ...taskWithEscrow, escrowAddress: null }
    mockLimit.mockResolvedValue([taskNoEscrow])
    mockSetReturning.mockResolvedValue([{ ...taskNoEscrow, status: 'accepted' }])

    const response = await POST(makeRequest(), { params: paramsPromise })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('accepted')
    expect(data.releaseTx).toBeUndefined()
    expect(data.walletWarning).toBeUndefined()
    expect(sendReleaseEscrow).not.toHaveBeenCalled()
  })
})
