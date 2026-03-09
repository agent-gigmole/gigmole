import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsertValues = vi.fn().mockResolvedValue([])
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues })

const mockSelectResult = vi.fn()
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectResult })
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

vi.mock('@/lib/email/resend', () => ({
  sendApiKeyResetEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { POST } from '@/app/api/auth/request-reset/route'
import { sendApiKeyResetEmail } from '@/lib/email/resend'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/request-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/request-reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: rate limit returns 0 (not rate limited)
    // The where mock needs to resolve differently for rate limit vs user lookup
    // Rate limit query: select({count}).from(...).where(and(...)) -- no .limit()
    // User lookup: select({id, email}).from(...).where(...).limit(1)
    mockSelectWhere.mockImplementation(() => {
      // Return both .limit and direct resolution for chained queries
      return {
        limit: mockSelectResult,
        then: (resolve: (v: unknown) => void) => resolve([{ count: 0 }]),
      }
    })
  })

  it('sends reset code when user exists', async () => {
    // First call: rate limit count -> 0
    // Second call: user lookup -> found
    let callCount = 0
    mockSelectWhere.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Rate limit query (returns array directly, no .limit)
        return {
          limit: mockSelectResult,
          then: (resolve: (v: unknown) => void) => resolve([{ count: 0 }]),
        }
      }
      // User lookup (has .limit)
      mockSelectResult.mockResolvedValueOnce([{ id: 'user-uuid', email: 'test@example.com' }])
      return { limit: mockSelectResult }
    })

    const response = await POST(makeRequest({ email: 'test@example.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/sent/)
    expect(sendApiKeyResetEmail).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('returns success even when user does not exist (no info leak)', async () => {
    let callCount = 0
    mockSelectWhere.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          limit: mockSelectResult,
          then: (resolve: (v: unknown) => void) => resolve([{ count: 0 }]),
        }
      }
      mockSelectResult.mockResolvedValueOnce([])
      return { limit: mockSelectResult }
    })

    const response = await POST(makeRequest({ email: 'unknown@example.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/sent/)
    expect(sendApiKeyResetEmail).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns 400 without email', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 400 with invalid email', async () => {
    const response = await POST(makeRequest({ email: 'not-email' }))
    expect(response.status).toBe(400)
  })

  it('silently rate limits (still returns success)', async () => {
    // Rate limit count returns 3 (at limit)
    mockSelectWhere.mockImplementation(() => {
      return {
        limit: mockSelectResult,
        then: (resolve: (v: unknown) => void) => resolve([{ count: 3 }]),
      }
    })

    const response = await POST(makeRequest({ email: 'test@example.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/sent/)
    // Should NOT actually send email when rate limited
    expect(sendApiKeyResetEmail).not.toHaveBeenCalled()
  })
})
