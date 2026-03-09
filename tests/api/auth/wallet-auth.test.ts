import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('USER_SESSION_SECRET', 'test-user-secret-32chars-long-xx')

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      banned: false,
    }]),
  },
}))

import { POST as noncePOST } from '@/app/api/auth/nonce/route'
import { NextRequest } from 'next/server'

describe('POST /api/auth/nonce', () => {
  it('returns nonce for valid wallet address', async () => {
    const req = new NextRequest('http://localhost/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' }),
    })
    const res = await noncePOST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.nonce).toBeTruthy()
    expect(data.timestamp).toBeTruthy()
    expect(data.message).toContain('GigMole')
  })

  it('returns 400 without wallet_address', async () => {
    const req = new NextRequest('http://localhost/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await noncePOST(req)
    expect(res.status).toBe(400)
  })
})
