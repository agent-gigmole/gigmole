import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashCode } from '@/lib/services/verification-utils'

const mockUpdateWhere = vi.fn().mockResolvedValue([])
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

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

vi.mock('@/lib/services/user-service', () => ({
  findOrCreateUserByEmail: vi.fn().mockResolvedValue({ id: 'user-uuid', email: 'test@example.com' }),
  bindAgentToUser: vi.fn().mockResolvedValue({ id: 'agent-uuid', ownerId: 'user-uuid' }),
  isEmailTaken: vi.fn().mockResolvedValue(false),
}))

import { POST } from '@/app/api/auth/bind-email/verify-code/route'
import { findOrCreateUserByEmail, bindAgentToUser } from '@/lib/services/user-service'

const correctCode = '123456'
const correctCodeHash = hashCode(correctCode)

const validToken = {
  id: 'token-uuid',
  agentId: 'agent-uuid',
  bindToken: 'a'.repeat(64),
  email: 'test@example.com',
  emailCode: correctCodeHash,
  emailCodeExpiresAt: new Date(Date.now() + 300_000),
  emailAttempts: 0,
  status: 'email_sent',
  expiresAt: new Date(Date.now() + 600_000),
  createdAt: new Date(),
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/bind-email/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/bind-email/verify-code', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectLimit.mockResolvedValue([validToken])
  })

  it('verifies code and binds email successfully', async () => {
    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: correctCode })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/bound/)
    expect(data.email).toBe('test@example.com')
    expect(findOrCreateUserByEmail).toHaveBeenCalledWith('test@example.com')
    expect(bindAgentToUser).toHaveBeenCalledWith('agent-uuid', 'user-uuid')
  })

  it('returns 400 without bind_token', async () => {
    const response = await POST(
      makeRequest({ code: correctCode })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 without code', async () => {
    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken })
    )
    expect(response.status).toBe(400)
  })

  it('returns 404 for non-existent token', async () => {
    mockSelectLimit.mockResolvedValueOnce([])

    const response = await POST(
      makeRequest({ bind_token: 'nonexistent', code: correctCode })
    )
    expect(response.status).toBe(404)
  })

  it('returns 410 for expired token', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, expiresAt: new Date(Date.now() - 1000) },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: correctCode })
    )
    expect(response.status).toBe(410)
  })

  it('returns 410 for completed token', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, status: 'completed' },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: correctCode })
    )
    expect(response.status).toBe(410)
  })

  it('returns 400 if no code was sent yet (pending status)', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, status: 'pending' },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: correctCode })
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/sent/)
  })

  it('returns 400 with wrong code and decrements attempts', async () => {
    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: '999999' })
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/invalid/i)
    expect(data.attempts_remaining).toBeDefined()
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('returns 429 after max verify attempts', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, emailAttempts: 5 },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: correctCode })
    )
    expect(response.status).toBe(429)
  })

  it('returns 410 when code has expired', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, emailCodeExpiresAt: new Date(Date.now() - 1000) },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, code: correctCode })
    )
    expect(response.status).toBe(410)
    const data = await response.json()
    expect(data.error).toMatch(/expired/)
  })
})
