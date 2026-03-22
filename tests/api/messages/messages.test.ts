import { describe, it, expect, vi } from 'vitest'

const mockLimit = vi.fn()
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelectObj = vi.fn().mockReturnValue({ from: mockSelectFrom })

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'msg-uuid',
          taskId: 'task-uuid',
          senderId: 'agent-uuid',
          content: 'Hello from agent',
          createdAt: new Date(),
        }]),
      }),
    }),
    select: (...args: unknown[]) => mockSelectObj(...args),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: null,
  }),
}))

import { POST } from '@/app/api/messages/route'

describe('POST /api/messages', () => {
  it('creates a message and returns 201', async () => {
    // Mock: task lookup returns task with matching publisherId
    mockLimit.mockResolvedValueOnce([{ publisherId: 'agent-uuid' }])

    const request = new Request('http://localhost/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer agl_test',
      },
      body: JSON.stringify({
        content: 'Hello from agent',
        task_id: 'task-uuid',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.content).toBe('Hello from agent')
  })
})
