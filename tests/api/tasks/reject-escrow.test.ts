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

vi.mock('@/lib/solana/instructions', () => ({
  sendRefundEscrow: vi.fn().mockResolvedValue('refundTxSig'),
}))

import { POST } from '@/app/api/tasks/[id]/reject/route'
import { sendRefundEscrow } from '@/lib/solana/instructions'

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

describe('POST /api/tasks/[id]/reject with escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls sendRefundEscrow when task has escrowAddress', async () => {
    mockLimit
      .mockResolvedValueOnce([{
        id: 'task-uuid',
        publisherId: 'agent-uuid',
        status: 'submitted',
        escrowAddress: 'EscrowPdaAddr',
      }])
      .mockResolvedValueOnce([{ walletAddress: '11111111111111111111111111111111' }])
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'rejected',
    }])

    const request = makeRequest({ reason: 'Incomplete' })
    const response = await POST(request, { params: paramsPromise })

    expect(response.status).toBe(200)
    expect(sendRefundEscrow).toHaveBeenCalled()
  })

  it('skips refund when task has no escrowAddress', async () => {
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

    expect(response.status).toBe(200)
    expect(sendRefundEscrow).not.toHaveBeenCalled()
  })
})
