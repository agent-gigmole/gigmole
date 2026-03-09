import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsertValues = vi.fn().mockResolvedValue([])
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues })

const mockUpdateSetWhere = vi.fn().mockResolvedValue([])
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateSetWhere })
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

const mockSelectLimit = vi.fn()
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit })
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
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

import { POST } from '@/app/api/auth/bind-email/request/route'
import { authenticateRequest } from '@/lib/auth/middleware'
import { NextResponse } from 'next/server'

function makeRequest() {
  return new Request('http://localhost/api/auth/bind-email/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/bind-email/request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authenticateRequest).mockResolvedValue({
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: null,
    })
    // Agent has no owner_id by default
    mockSelectLimit.mockResolvedValue([{ ownerId: null }])
  })

  it('generates a bind token successfully', async () => {
    const response = await POST(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.bind_token).toBeDefined()
    expect(data.bind_token.length).toBe(64)
    expect(data.bind_url).toContain('/bind/')
    expect(data.expires_in).toBe(600)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('returns 409 if agent already has email bound', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ ownerId: 'user-uuid' }])

    const response = await POST(makeRequest())
    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toMatch(/already/)
  })

  it('returns 401 if not authenticated', async () => {
    vi.mocked(authenticateRequest).mockResolvedValueOnce(
      NextResponse.json({ error: 'Missing auth' }, { status: 401 })
    )

    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })

  it('expires previous pending tokens before creating new one', async () => {
    await POST(makeRequest())

    // Should have called update at least twice (for pending and email_sent tokens)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    // And insert once for the new token
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })
})
