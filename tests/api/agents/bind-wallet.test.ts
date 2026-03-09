import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('USER_SESSION_SECRET', 'test-user-secret-32chars-long-xx')

const mockSetReturning = vi.fn()
const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockSetReturning })
const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

const mockSelectLimit = vi.fn()
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit })
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

vi.mock('@/lib/db', () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: null,
  }),
}))

vi.mock('@/lib/auth/wallet', () => ({
  verifyNonce: vi.fn().mockReturnValue(true),
  verifyWalletSignature: vi.fn().mockResolvedValue(true),
}))

import { POST } from '@/app/api/agents/bind-wallet/route'
import { verifyNonce, verifyWalletSignature } from '@/lib/auth/wallet'
import { authenticateRequest } from '@/lib/auth/middleware'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/agents/bind-wallet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/agents/bind-wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifyNonce).mockReturnValue(true)
    vi.mocked(verifyWalletSignature).mockResolvedValue(true)
    vi.mocked(authenticateRequest).mockResolvedValue({
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: null,
    })
    // No existing wallet by default
    mockSelectLimit.mockResolvedValue([])
    mockSetReturning.mockResolvedValue([{
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    }])
  })

  it('binds wallet with valid signature and returns updated agent', async () => {
    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: [1, 2, 3, 4],
      nonce: 'valid-nonce',
      timestamp: Date.now(),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.walletAddress).toBe('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')
    expect(verifyNonce).toHaveBeenCalled()
    expect(verifyWalletSignature).toHaveBeenCalled()
  })

  it('returns 400 if signature is missing', async () => {
    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/required/)
  })

  it('returns 400 if nonce is missing', async () => {
    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: [1, 2, 3],
      timestamp: Date.now(),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/required/)
  })

  it('returns 401 if nonce verification fails', async () => {
    vi.mocked(verifyNonce).mockReturnValueOnce(false)

    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: [1, 2, 3],
      nonce: 'bad-nonce',
      timestamp: Date.now(),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toMatch(/nonce/i)
  })

  it('returns 401 if signature verification fails', async () => {
    vi.mocked(verifyWalletSignature).mockResolvedValueOnce(false)

    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: [1, 2, 3],
      nonce: 'valid-nonce',
      timestamp: Date.now(),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toMatch(/signature/i)
  })

  it('returns 409 if wallet is already bound to another agent', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'other-agent-uuid' }])

    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: [1, 2, 3],
      nonce: 'valid-nonce',
      timestamp: Date.now(),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toMatch(/already bound/)
  })

  it('allows re-binding same wallet to same agent', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'agent-uuid' }])

    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: [1, 2, 3],
      nonce: 'valid-nonce',
      timestamp: Date.now(),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('returns 400 if signature is not an array', async () => {
    const request = makeRequest({
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      signature: 'not-an-array',
      nonce: 'valid-nonce',
      timestamp: Date.now(),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/array/)
  })
})
