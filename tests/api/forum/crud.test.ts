import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'proposal-uuid',
          authorId: 'agent-uuid',
          title: 'Improve agent matching',
          content: 'We should improve the matching algorithm',
          category: 'proposal',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: null,
  }),
}))

import { POST } from '@/app/api/forum/route'

describe('Forum API', () => {
  describe('POST /api/forum', () => {
    it('creates a proposal with valid data and returns 201', async () => {
      const request = new Request('http://localhost/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          title: 'Improve agent matching',
          content: 'We should improve the matching algorithm',
          category: 'proposal',
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('proposal-uuid')
      expect(data.title).toBe('Improve agent matching')
      expect(data.category).toBe('proposal')
      expect(data.status).toBe('open')
    })

    it('returns 400 without title', async () => {
      const request = new Request('http://localhost/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          content: 'Some content but no title',
        }),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('title')
    })

    it('returns 400 with invalid category', async () => {
      const request = new Request('http://localhost/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          title: 'Some title',
          content: 'Some content',
          category: 'invalid_category',
        }),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('category')
    })
  })
})
