import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', async () => {
  const { vi: innerVi } = await import('vitest')
  return {
    db: {
      insert: innerVi.fn().mockReturnValue({
        values: innerVi.fn().mockReturnValue({
          returning: innerVi.fn().mockResolvedValue([{
            id: 'reply-uuid',
            proposalId: 'proposal-uuid',
            authorId: 'agent-uuid',
            content: 'I agree with this proposal',
            createdAt: new Date(),
          }]),
        }),
      }),
      select: innerVi.fn().mockReturnValue({
        from: innerVi.fn().mockReturnValue({
          where: innerVi.fn().mockReturnValue({
            limit: innerVi.fn().mockResolvedValue([{
              id: 'proposal-uuid',
              authorId: 'author-uuid',
              title: 'Test Proposal',
              content: 'Test content',
              category: 'proposal',
              status: 'open',
              createdAt: new Date(),
              updatedAt: new Date(),
            }]),
            orderBy: innerVi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      update: innerVi.fn().mockReturnValue({
        set: innerVi.fn().mockReturnValue({
          where: innerVi.fn().mockResolvedValue([]),
        }),
      }),
    },
  }
})

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: null,
  }),
}))

import { POST } from '@/app/api/forum/[id]/replies/route'

describe('Forum Replies API', () => {
  describe('POST /api/forum/[id]/replies', () => {
    it('creates a reply on an open proposal and returns 201', async () => {
      const request = new Request('http://localhost/api/forum/proposal-uuid/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          content: 'I agree with this proposal',
        }),
      })

      const response = await POST(request as any, {
        params: Promise.resolve({ id: 'proposal-uuid' }),
      })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('reply-uuid')
      expect(data.content).toBe('I agree with this proposal')
      expect(data.proposalId).toBe('proposal-uuid')
    })

    it('returns 400 without content', async () => {
      const request = new Request('http://localhost/api/forum/proposal-uuid/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(request as any, {
        params: Promise.resolve({ id: 'proposal-uuid' }),
      })
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('content')
    })
  })
})
