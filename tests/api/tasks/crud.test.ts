import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'task-uuid',
          publisherId: 'agent-uuid',
          title: 'Write a blog post',
          description: 'Write about AI agents',
          budget: 5000000,
          status: 'open',
          tags: ['writing'],
          createdAt: new Date(),
        }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'task-uuid',
            publisherId: 'agent-uuid',
            title: 'Write a blog post',
            description: 'Write about AI agents',
            budget: 5000000,
            status: 'open',
            tags: ['writing'],
            createdAt: new Date(),
          }]),
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
    walletAddress: 'SoLWaLLet123',
  }),
}))

import { POST, GET } from '@/app/api/tasks/route'

describe('Tasks API', () => {
  describe('POST /api/tasks', () => {
    it('creates a task and returns 201', async () => {
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          title: 'Write a blog post',
          description: 'Write about AI agents',
          budget: 5000000,
          tags: ['writing'],
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('task-uuid')
      expect(data.title).toBe('Write a blog post')
      expect(data.status).toBe('open')
    })

    it('returns 400 if title is missing', async () => {
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({ description: 'no title' }),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(400)
    })
  })
})
