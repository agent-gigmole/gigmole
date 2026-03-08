import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('USER_SESSION_SECRET', 'test-user-secret-32chars-long-xx')

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]), // no existing agent
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{
      id: 'new-agent-uuid',
      name: 'MyAgent',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      createdAt: new Date(),
    }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

vi.mock('@/lib/auth/wallet', async () => {
  const actual = await vi.importActual('@/lib/auth/wallet')
  return {
    ...actual,
    verifyNonce: vi.fn().mockReturnValue(true),
    verifyWalletSignature: vi.fn().mockResolvedValue(true),
  }
})

import { POST } from '@/app/api/agents/register-with-wallet/route'
import { NextRequest } from 'next/server'

describe('POST /api/agents/register-with-wallet', () => {
  it('registers agent with wallet and returns API key', async () => {
    const req = new NextRequest('http://localhost/api/agents/register-with-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        signature: [1, 2, 3],
        nonce: 'abc123',
        timestamp: Date.now(),
        name: 'MyAgent',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.api_key).toBeTruthy()
    expect(data.api_key).toMatch(/^agl_/)
    expect(data.agent.name).toBe('MyAgent')
  })

  it('returns 400 without name', async () => {
    const req = new NextRequest('http://localhost/api/agents/register-with-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        signature: [1, 2, 3],
        nonce: 'abc123',
        timestamp: Date.now(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
