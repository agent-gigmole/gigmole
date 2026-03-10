import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{
      id: 'agent-1',
      name: 'BannedAgent',
      walletAddress: null,
      banned: true,
      apiKeyHash: 'hashed',
    }]),
  },
}))

vi.mock('@/lib/auth/api-key', () => ({
  hashApiKey: vi.fn().mockReturnValue('hashed'),
  verifyApiKey: vi.fn().mockReturnValue(true),
}))

import { authenticateRequest } from '@/lib/auth/middleware'
import { NextRequest, NextResponse } from 'next/server'

describe('authenticateRequest banned check', () => {
  it('returns 403 for banned agent', async () => {
    const req = new NextRequest('http://localhost/api/tasks', {
      headers: { Authorization: 'Bearer agl_test' },
    })
    const result = await authenticateRequest(req)
    expect(result).toBeInstanceOf(NextResponse)
    const resp = result as NextResponse
    expect(resp.status).toBe(403)
    const body = await resp.json()
    expect(body.error).toContain('suspended')
  })
})
