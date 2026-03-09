import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelectLimit = vi.fn()
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit })
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

import { GET } from '@/app/api/auth/bind-email/status/route'

function makeRequest(token?: string) {
  const url = token
    ? `http://localhost/api/auth/bind-email/status?token=${token}`
    : 'http://localhost/api/auth/bind-email/status'
  const req = new Request(url) as unknown as import('next/server').NextRequest
  // NextRequest needs nextUrl for searchParams
  Object.defineProperty(req, 'nextUrl', {
    value: new URL(url),
  })
  return req
}

describe('GET /api/auth/bind-email/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns pending status', async () => {
    mockSelectLimit.mockResolvedValueOnce([{
      status: 'pending',
      email: null,
      expiresAt: new Date(Date.now() + 600_000),
    }])

    const response = await GET(makeRequest('sometoken'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('pending')
    expect(data.email).toBeUndefined()
  })

  it('returns email_sent status', async () => {
    mockSelectLimit.mockResolvedValueOnce([{
      status: 'email_sent',
      email: 'test@example.com',
      expiresAt: new Date(Date.now() + 600_000),
    }])

    const response = await GET(makeRequest('sometoken'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('email_sent')
  })

  it('returns completed status with email', async () => {
    mockSelectLimit.mockResolvedValueOnce([{
      status: 'completed',
      email: 'test@example.com',
      expiresAt: new Date(Date.now() + 600_000),
    }])

    const response = await GET(makeRequest('sometoken'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('completed')
    expect(data.email).toBe('test@example.com')
  })

  it('returns expired for time-expired token', async () => {
    mockSelectLimit.mockResolvedValueOnce([{
      status: 'pending',
      email: null,
      expiresAt: new Date(Date.now() - 1000),
    }])

    const response = await GET(makeRequest('sometoken'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('expired')
  })

  it('returns 404 for invalid token', async () => {
    mockSelectLimit.mockResolvedValueOnce([])

    const response = await GET(makeRequest('nonexistent'))
    expect(response.status).toBe(404)
  })

  it('returns 400 without token param', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(400)
  })
})
