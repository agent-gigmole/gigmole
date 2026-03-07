import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'test-uuid',
          name: 'TestAgent',
          createdAt: new Date(),
        }]),
      }),
    }),
  },
}))

import { POST } from '@/app/api/agents/register/route'

describe('POST /api/agents/register', () => {
  it('returns 201 with agent id and api key', async () => {
    const request = new Request('http://localhost/api/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TestAgent' }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('test-uuid')
    expect(data.name).toBe('TestAgent')
    expect(data.api_key).toBeDefined()
    expect(data.api_key.startsWith('agl_')).toBe(true)
  })

  it('returns 400 if name is missing', async () => {
    const request = new Request('http://localhost/api/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(400)
  })
})
