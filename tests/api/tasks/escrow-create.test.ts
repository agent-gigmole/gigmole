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

vi.mock('@/lib/solana/escrow', () => ({
  parseEscrowAccount: vi.fn(),
  getEscrowPDA: vi.fn().mockReturnValue([{ toBase58: () => 'EscrowPdaAddr' }, 255]),
}))

import { POST } from '@/app/api/tasks/route'
import { parseEscrowAccount } from '@/lib/solana/escrow'

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
      escrowTx: 'txSig123',
    }])
  })

  it('creates task with escrow verification when escrow_tx provided', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue({
      publisher: 'PublisherWalletAddr',
      platformAuthority: 'PlatformAuthPubkey',
      amount: 5000000,
      listingFee: 2000000,
      feeBps: 500,
      taskId: 'task-uuid',
      status: 'Funded',
      bump: 255,
    })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    // Verify insert was called with escrow fields
    const insertedValues = mockValues.mock.calls[0][0]
    expect(insertedValues.escrowAddress).toBe('EscrowPdaAddr')
    expect(insertedValues.escrowTx).toBe('txSig123')
    expect(insertedValues.id).toBe('task-uuid')
  })

  it('rejects if escrow not found on-chain', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue(null)

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/escrow/i)
  })

  it('rejects if escrow amount does not match budget', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue({
      publisher: 'PublisherWalletAddr',
      platformAuthority: 'PlatformAuthPubkey',
      amount: 1000000,
      listingFee: 2000000,
      feeBps: 500,
      taskId: 'task-uuid',
      status: 'Funded',
      bump: 255,
    })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/mismatch/i)
  })

  it('rejects if escrow publisher does not match agent wallet', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue({
      publisher: 'SomeOtherWallet',
      platformAuthority: 'PlatformAuthPubkey',
      amount: 5000000,
      listingFee: 2000000,
      feeBps: 500,
      taskId: 'task-uuid',
      status: 'Funded',
      bump: 255,
    })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
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
    expect(parseEscrowAccount).not.toHaveBeenCalled()
  })
})
