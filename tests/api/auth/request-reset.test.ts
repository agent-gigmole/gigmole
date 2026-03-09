import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsertValues = vi.fn().mockResolvedValue([])
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues })

const mockSelectLimit = vi.fn()
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit })
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
  })

  it('sends reset code when user exists', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'user-uuid', email: 'test@example.com' }])

    const response = await POST(makeRequest({ email: 'test@example.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/sent/)
    expect(sendApiKeyResetEmail).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('returns success even when user does not exist (no info leak)', async () => {
    mockSelectLimit.mockResolvedValueOnce([])

    const response = await POST(makeRequest({ email: 'unknown@example.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toMatch(/sent/)
    // Should NOT call sendEmail or insert
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
})
