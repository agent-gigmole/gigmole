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

vi.mock('@/lib/solana/instructions', () => ({
  sendReleaseEscrow: vi.fn().mockResolvedValue('releaseTxSig'),
  sendRefundEscrow: vi.fn().mockResolvedValue('refundTxSig'),
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
  awardedBidId: 'bid-uuid',
  createdAt: new Date(),
}

const bidFixture = {
  id: 'bid-uuid',
  taskId: 'task-uuid',
  bidderId: 'agent-uuid',
  proposal: 'I can do this',
  price: 4000000,
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
      // First limit call returns task, second returns awarded bid
      mockLimit.mockResolvedValueOnce([taskFixture]).mockResolvedValueOnce([bidFixture])
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

    it('calls sendReleaseEscrow when task has escrowAddress', async () => {
      const { sendReleaseEscrow } = await import('@/lib/solana/instructions')

      const taskWithEscrow = {
        ...taskFixture,
        status: 'submitted',
        escrowAddress: 'EscrowPdaAddr',
        awardedBidId: 'bid-uuid',
      }
      // First call: task lookup, second: bid lookup, third: agent lookup
      mockLimit
        .mockResolvedValueOnce([taskWithEscrow])
        .mockResolvedValueOnce([{ ...bidFixture, bidderId: 'worker-uuid' }])
        .mockResolvedValueOnce([{ walletAddress: '11111111111111111111111111111112' }])
      mockSetReturning.mockResolvedValue([{ ...taskWithEscrow, status: 'accepted' }])

      const request = makeRequest('http://localhost/api/tasks/task-uuid/accept', {})
      const response = await acceptPOST(request, { params: paramsPromise })

      expect(response.status).toBe(200)
      expect(sendReleaseEscrow).toHaveBeenCalled()
    })

    it('skips escrow release when task has no escrowAddress', async () => {
      const { sendReleaseEscrow } = await import('@/lib/solana/instructions')
      vi.mocked(sendReleaseEscrow).mockClear()

      mockLimit.mockResolvedValue([{ ...taskFixture, status: 'submitted', escrowAddress: null }])
      mockSetReturning.mockResolvedValue([{ ...taskFixture, status: 'accepted' }])

      const request = makeRequest('http://localhost/api/tasks/task-uuid/accept', {})
      const response = await acceptPOST(request, { params: paramsPromise })

      expect(response.status).toBe(200)
      expect(sendReleaseEscrow).not.toHaveBeenCalled()
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
