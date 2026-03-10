import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashCode } from '@/lib/services/verification-utils'

const mockUpdateWhere = vi.fn().mockResolvedValue([])
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet })

const mockSelectLimit = vi.fn()
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit })
const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit })
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom })

vi.mock('@/lib/db', () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

import { POST } from '@/app/api/auth/reset-api-key/route'

const correctCode = '123456'
const correctCodeHash = hashCode(correctCode)

const validResetToken = {
  id: 'reset-uuid',
  userId: 'user-uuid',
  email: 'test@example.com',
  codeHash: correctCodeHash,
  codeExpiresAt: new Date(Date.now() + 300_000),
  attempts: 0,
  used: false,
  createdAt: new Date(),
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/reset-api-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/reset-api-key', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock chain: first select returns reset token, second returns agent
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit, orderBy: mockSelectOrderBy })
    mockSelectLimit.mockResolvedValue([validResetToken])
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit })
  })

  it('resets API key with valid code', async () => {
    // First call: find reset token
    mockSelectLimit.mockResolvedValueOnce([validResetToken])
    // Second call: find agent
    mockSelectLimit.mockResolvedValueOnce([{ id: 'agent-uuid', ownerId: 'user-uuid' }])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: correctCode, agent_id: 'agent-uuid' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.api_key).toBeDefined()
    expect(data.api_key).toMatch(/^agl_/)
    expect(data.message).toMatch(/reset/)
  })

  it('returns 400 without required fields', async () => {
    let response = await POST(makeRequest({ email: 'test@example.com', code: '123456' }))
    expect(response.status).toBe(400)

    response = await POST(makeRequest({ email: 'test@example.com', agent_id: 'agent-uuid' }))
    expect(response.status).toBe(400)

    response = await POST(makeRequest({ code: '123456', agent_id: 'agent-uuid' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when no reset token found', async () => {
    mockSelectLimit.mockResolvedValueOnce([])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: correctCode, agent_id: 'agent-uuid' })
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/pending/)
  })

  it('returns 429 after max attempts', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validResetToken, attempts: 5 },
    ])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: correctCode, agent_id: 'agent-uuid' })
    )
    expect(response.status).toBe(429)
  })

  it('returns 410 when code expired', async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { ...validResetToken, codeExpiresAt: new Date(Date.now() - 1000) },
    ])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: correctCode, agent_id: 'agent-uuid' })
    )
    expect(response.status).toBe(410)
  })

  it('returns 400 with wrong code and increments attempts', async () => {
    mockSelectLimit.mockResolvedValueOnce([validResetToken])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: '999999', agent_id: 'agent-uuid' })
    )
    expect(response.status).toBe(400)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('returns 403 if agent does not belong to user', async () => {
    // First call: reset token
    mockSelectLimit.mockResolvedValueOnce([validResetToken])
    // Second call: agent with different owner
    mockSelectLimit.mockResolvedValueOnce([{ id: 'agent-uuid', ownerId: 'other-user-uuid' }])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: correctCode, agent_id: 'agent-uuid' })
    )
    expect(response.status).toBe(403)
  })

  it('returns 404 if agent not found', async () => {
    mockSelectLimit.mockResolvedValueOnce([validResetToken])
    mockSelectLimit.mockResolvedValueOnce([])

    const response = await POST(
      makeRequest({ email: 'test@example.com', code: correctCode, agent_id: 'nonexistent' })
    )
    expect(response.status).toBe(404)
  })
})
