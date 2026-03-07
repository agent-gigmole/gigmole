import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReturning = vi.fn()
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

const mockSetReturning = vi.fn()
const mockSet = vi.fn().mockReturnValue({
  where: vi.fn().mockReturnValue({ returning: mockSetReturning }),
})
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

const mockLimit = vi.fn()
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'SoLWaLLet123',
  }),
}))

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
}))

import { POST as submitPOST } from '@/app/api/tasks/[id]/submit/route'
import { POST as acceptPOST } from '@/app/api/tasks/[id]/accept/route'
import { POST as rejectPOST } from '@/app/api/tasks/[id]/reject/route'
import { isValidTransition } from '@/lib/services/task-service'

const taskFixture = {
  id: 'task-uuid',
  publisherId: 'agent-uuid',
  title: 'Write a blog post',
  description: 'Write about AI agents',
  budget: 5000000,
  status: 'in_progress',
  tags: ['writing'],
  createdAt: new Date(),
}

const submissionFixture = {
  id: 'sub-uuid',
  taskId: 'task-uuid',
  content: 'Here is the deliverable',
  tokensUsed: 1200,
  submittedAt: new Date(),
}

function makeRequest(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

describe('Execution API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLimit.mockResolvedValue([taskFixture])
    mockReturning.mockResolvedValue([submissionFixture])
    mockSetReturning.mockResolvedValue([{ ...taskFixture, status: 'submitted' }])
    vi.mocked(isValidTransition).mockReturnValue(true)
  })

  describe('POST /api/tasks/[id]/submit', () => {
    it('submits a deliverable and returns 201', async () => {
      const request = makeRequest('http://localhost/api/tasks/task-uuid/submit', {
        content: 'Here is the deliverable',
        tokens_used: 1200,
      })

      const response = await submitPOST(request, { params: paramsPromise })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.submission.id).toBe('sub-uuid')
      expect(data.task.status).toBe('submitted')
    })

    it('returns 400 if content is missing', async () => {
      const request = makeRequest('http://localhost/api/tasks/task-uuid/submit', {})

      const response = await submitPOST(request, { params: paramsPromise })
      expect(response.status).toBe(400)
    })

    it('returns 404 if task does not exist', async () => {
      mockLimit.mockResolvedValueOnce([])

      const request = makeRequest('http://localhost/api/tasks/task-uuid/submit', {
        content: 'deliverable',
      })

      const response = await submitPOST(request, { params: paramsPromise })
      expect(response.status).toBe(404)
    })

    it('returns 409 if transition is invalid', async () => {
      vi.mocked(isValidTransition).mockReturnValueOnce(false)

      const request = makeRequest('http://localhost/api/tasks/task-uuid/submit', {
        content: 'deliverable',
      })

      const response = await submitPOST(request, { params: paramsPromise })
      expect(response.status).toBe(409)
    })
  })

  describe('POST /api/tasks/[id]/accept', () => {
    beforeEach(() => {
      mockLimit.mockResolvedValue([{ ...taskFixture, status: 'submitted' }])
      mockSetReturning.mockResolvedValue([{ ...taskFixture, status: 'accepted' }])
    })

    it('accepts a deliverable and returns the updated task', async () => {
      const request = makeRequest('http://localhost/api/tasks/task-uuid/accept', {})

      const response = await acceptPOST(request, { params: paramsPromise })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('accepted')
    })

    it('returns 403 if requester is not the publisher', async () => {
      mockLimit.mockResolvedValueOnce([{ ...taskFixture, publisherId: 'other-agent' }])

      const request = makeRequest('http://localhost/api/tasks/task-uuid/accept', {})

      const response = await acceptPOST(request, { params: paramsPromise })
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/tasks/[id]/reject', () => {
    beforeEach(() => {
      mockLimit.mockResolvedValue([{ ...taskFixture, status: 'submitted' }])
      mockSetReturning.mockResolvedValue([{ ...taskFixture, status: 'rejected' }])
    })

    it('rejects a deliverable and returns task with reason', async () => {
      const request = makeRequest('http://localhost/api/tasks/task-uuid/reject', {
        reason: 'Does not meet spec',
      })

      const response = await rejectPOST(request, { params: paramsPromise })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.task.status).toBe('rejected')
      expect(data.reason).toBe('Does not meet spec')
    })

    it('returns 403 if requester is not the publisher', async () => {
      mockLimit.mockResolvedValueOnce([{ ...taskFixture, publisherId: 'other-agent' }])

      const request = makeRequest('http://localhost/api/tasks/task-uuid/reject', {
        reason: 'bad',
      })

      const response = await rejectPOST(request, { params: paramsPromise })
      expect(response.status).toBe(403)
    })
  })
})
