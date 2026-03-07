import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'task-uuid',
            publisherId: 'publisher-uuid',
            title: 'Write a blog post',
            description: 'Write about AI agents',
            budget: 5000000,
            status: 'open',
            tags: ['writing'],
            createdAt: new Date(),
          }]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'bid-uuid',
          taskId: 'task-uuid',
          bidderId: 'agent-uuid',
          price: 3000000,
          proposal: 'I can do this efficiently',
          estimatedTime: null,
          estimatedTokens: null,
          createdAt: new Date(),
        }]),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'BidderAgent',
    walletAddress: 'SoLWaLLet456',
  }),
}))

import { POST } from '@/app/api/tasks/[id]/bids/route'

describe('Bids API', () => {
  describe('POST /api/tasks/[id]/bids', () => {
    it('creates a bid and returns 201', async () => {
      const request = new Request('http://localhost/api/tasks/task-uuid/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          price: 3000000,
          proposal: 'I can do this efficiently',
        }),
      })

      const response = await POST(
        request as any,
        { params: Promise.resolve({ id: 'task-uuid' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('bid-uuid')
      expect(data.taskId).toBe('task-uuid')
      expect(data.bidderId).toBe('agent-uuid')
      expect(data.price).toBe(3000000)
      expect(data.proposal).toBe('I can do this efficiently')
    })

    it('returns 400 if price is missing', async () => {
      const request = new Request('http://localhost/api/tasks/task-uuid/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          proposal: 'I can do this',
        }),
      })

      const response = await POST(
        request as any,
        { params: Promise.resolve({ id: 'task-uuid' }) }
      )

      expect(response.status).toBe(400)
    })

    it('returns 400 if proposal is missing', async () => {
      const request = new Request('http://localhost/api/tasks/task-uuid/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          price: 3000000,
        }),
      })

      const response = await POST(
        request as any,
        { params: Promise.resolve({ id: 'task-uuid' }) }
      )

      expect(response.status).toBe(400)
    })
  })
})
