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

const mockAuthenticateRequest = vi.fn()
vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
}))

vi.mock('@/lib/services/escrow-service', () => ({
  verifyEscrowDeposit: vi.fn(),
  EscrowVerificationError: class extends Error {},
}))

import { POST } from '@/app/api/tasks/route'

// Valid base58 tx signature (88 chars)
const validTxSig = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQU'

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

describe('POST /api/tasks — escrow mode wallet check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning.mockResolvedValue([{
      id: 'task-uuid',
      title: 'Test Task',
      budget: 7000000,
      status: 'open',
    }])
  })

  it('returns 400 when escrow_tx provided but agent has no wallet', async () => {
    mockAuthenticateRequest.mockResolvedValue({
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: null,
    })

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
    expect(data.error).toMatch(/bind a wallet/)
  })

  it('proceeds normally when escrow_tx not provided and no wallet', async () => {
    mockAuthenticateRequest.mockResolvedValue({
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: null,
    })

    const request = makeRequest({
      title: 'Simple Task',
      description: 'No escrow',
      budget: 5000000,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
