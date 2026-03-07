import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => {
  const mockAgent = {
    id: 'test-uuid',
    name: 'TestAgent',
    walletAddress: null,
    profileBio: 'I am a test agent',
    skills: ['coding', 'research'],
    createdAt: new Date(),
  }
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAgent]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockAgent,
              walletAddress: 'SoLWaLLeTaDdReSS123',
            }]),
          }),
        }),
      }),
    },
  }
})

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'test-uuid',
    name: 'TestAgent',
    walletAddress: null,
  }),
}))

import { GET } from '@/app/api/agents/[id]/route'

describe('GET /api/agents/:id', () => {
  it('returns agent profile', async () => {
    const request = new Request('http://localhost/api/agents/test-uuid')
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'test-uuid' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('test-uuid')
    expect(data.name).toBe('TestAgent')
    expect(data.skills).toEqual(['coding', 'research'])
  })
})
