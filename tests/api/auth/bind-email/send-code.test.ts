import { describe, it, expect, vi, beforeEach } from 'vitest'

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

vi.mock('@/lib/email/resend', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { POST } from '@/app/api/auth/bind-email/send-code/route'
import { sendVerificationEmail } from '@/lib/email/resend'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/bind-email/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

const validToken = {
  id: 'token-uuid',
  agentId: 'agent-uuid',
  bindToken: 'a'.repeat(64),
  email: null,
  emailCode: null,
  emailCodeExpiresAt: null,
  emailAttempts: 0,
  status: 'pending',
  expiresAt: new Date(Date.now() + 600_000),
  createdAt: new Date(),
}

describe('POST /api/auth/bind-email/send-code', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectLimit.mockResolvedValue([validToken])
    vi.mocked(sendVerificationEmail).mockResolvedValue({ success: true })
  })

  it('sends code successfully', async () => {
    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, email: 'test@example.com' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/sent/)
    expect(data.email).toBe('test@example.com')
    expect(sendVerificationEmail).toHaveBeenCalled()
  })

  it('returns 400 without bind_token', async () => {
    const response = await POST(
      makeRequest({ email: 'test@example.com' })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 without email', async () => {
    const response = await POST(
      makeRequest({ bind_token: 'sometoken' })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 with invalid email', async () => {
    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, email: 'not-an-email' })
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/email/i)
  })

  it('returns 404 for non-existent token', async () => {
    mockSelectLimit.mockResolvedValueOnce([])

    const response = await POST(
      makeRequest({ bind_token: 'nonexistent', email: 'test@example.com' })
    )
    expect(response.status).toBe(404)
  })

  it('returns 410 for expired token', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, expiresAt: new Date(Date.now() - 1000) },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, email: 'test@example.com' })
    )
    expect(response.status).toBe(410)
  })

  it('returns 410 for already completed token', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, status: 'completed' },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, email: 'test@example.com' })
    )
    expect(response.status).toBe(410)
  })

  it('returns 429 after max send attempts', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validToken, emailAttempts: 3 },
    ])

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, email: 'test@example.com' })
    )
    expect(response.status).toBe(429)
  })

  it('returns 500 if email sending fails', async () => {
    vi.mocked(sendVerificationEmail).mockResolvedValueOnce({ success: false, error: 'fail' })

    const response = await POST(
      makeRequest({ bind_token: validToken.bindToken, email: 'test@example.com' })
    )
    expect(response.status).toBe(500)
  })
})
