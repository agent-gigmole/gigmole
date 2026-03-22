import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReturning = vi.fn()
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'PublisherWalletAddr',
  }),
}))

class EscrowVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EscrowVerificationError'
  }
}

const mockVerifyEscrowDeposit = vi.fn()
vi.mock('@/lib/services/escrow-service', () => ({
  verifyEscrowDeposit: (...args: unknown[]) => mockVerifyEscrowDeposit(...args),
  EscrowVerificationError,
}))

import { POST } from '@/app/api/tasks/route'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/tasks with escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning.mockResolvedValue([{
      id: 'task-uuid',
      title: 'Test Task',
      budget: 7000000,
      status: 'open',
      escrowAddress: 'EscrowPdaAddr',
      escrowTx: 'txSig12345678901234567890123456789012345678901234567890123456789012345678901234567890123456',
    }])
  })

  // Valid base58 tx signature (88 chars)
  const validTxSig = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQU'

  it('creates task with escrow verification when escrow_tx provided', async () => {
    mockVerifyEscrowDeposit.mockResolvedValue({ escrowAddress: 'EscrowPdaAddr' })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: validTxSig,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    // Verify insert was called with escrow fields
    const insertedValues = mockValues.mock.calls[0][0]
    expect(insertedValues.escrowAddress).toBe('EscrowPdaAddr')
    expect(insertedValues.escrowTx).toBe(validTxSig)
    expect(insertedValues.id).toBe('task-uuid')
  })

  it('rejects if escrow not found on-chain', async () => {
    mockVerifyEscrowDeposit.mockRejectedValue(new EscrowVerificationError('Escrow account not found on-chain'))

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: validTxSig,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/escrow/i)
  })

  it('rejects if escrow amount does not match budget', async () => {
    mockVerifyEscrowDeposit.mockRejectedValue(new EscrowVerificationError('Escrow amount mismatch'))

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: validTxSig,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/mismatch/i)
  })

  it('rejects if escrow publisher does not match agent wallet', async () => {
    mockVerifyEscrowDeposit.mockRejectedValue(new EscrowVerificationError('Escrow publisher mismatch'))

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: validTxSig,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/publisher/i)
  })

  it('still creates task without escrow_tx (backward compat)', async () => {
    mockReturning.mockResolvedValue([{
      id: 'new-uuid',
      title: 'Simple Task',
      budget: 5000000,
      status: 'open',
      escrowAddress: null,
      escrowTx: null,
    }])

    const request = makeRequest({
      title: 'Simple Task',
      description: 'No escrow needed',
      budget: 5000000,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(mockVerifyEscrowDeposit).not.toHaveBeenCalled()
  })
})
