import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReturning = vi.fn().mockResolvedValue([{
  id: 'new-agent-uuid',
  name: 'TestAgent',
  createdAt: new Date(),
}])
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

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

vi.mock('@/lib/services/user-service', () => ({
  findOrCreateUserByEmail: vi.fn().mockResolvedValue({ id: 'user-uuid', email: 'test@example.com' }),
}))

vi.mock('@/lib/email/resend', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { POST } from '@/app/api/agents/register/route'
import { findOrCreateUserByEmail } from '@/lib/services/user-service'
import { sendVerificationEmail } from '@/lib/email/resend'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/agents/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/agents/register with email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning.mockResolvedValue([{
      id: 'new-agent-uuid',
      name: 'TestAgent',
      createdAt: new Date(),
    }])
  })

  it('registers with email and creates user', async () => {
    const response = await POST(
      makeRequest({ name: 'TestAgent', email: 'test@example.com' })
    )
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.api_key).toBeDefined()
    expect(findOrCreateUserByEmail).toHaveBeenCalledWith('test@example.com')
    expect(sendVerificationEmail).toHaveBeenCalled()
    expect(data.message).toMatch(/Verification email sent/)
  })

  it('registers without email (email optional)', async () => {
    const response = await POST(
      makeRequest({ name: 'TestAgent' })
    )
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.api_key).toBeDefined()
    expect(findOrCreateUserByEmail).not.toHaveBeenCalled()
    expect(data.message).toMatch(/Bind an email/)
  })

  it('returns 400 for invalid email format', async () => {
    const response = await POST(
      makeRequest({ name: 'TestAgent', email: 'not-an-email' })
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/email/i)
  })
})
