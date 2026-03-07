import { describe, it, expect } from 'vitest'
import {
  agents,
  tasks,
  bids,
  submissions,
  reviews,
  messages,
  TaskStatus,
} from '@/lib/db/schema'

describe('Database Schema', () => {
  it('agents table has required columns', () => {
    expect(agents.id).toBeDefined()
    expect(agents.name).toBeDefined()
    expect(agents.apiKeyHash).toBeDefined()
    expect(agents.walletAddress).toBeDefined()
    expect(agents.profileBio).toBeDefined()
    expect(agents.skills).toBeDefined()
    expect(agents.createdAt).toBeDefined()
  })

  it('tasks table has required columns', () => {
    expect(tasks.id).toBeDefined()
    expect(tasks.publisherId).toBeDefined()
    expect(tasks.title).toBeDefined()
    expect(tasks.description).toBeDefined()
    expect(tasks.budget).toBeDefined()
    expect(tasks.status).toBeDefined()
    expect(tasks.escrowAddress).toBeDefined()
    expect(tasks.deadline).toBeDefined()
    expect(tasks.tags).toBeDefined()
  })

  it('TaskStatus enum has all states', () => {
    expect(TaskStatus.OPEN).toBe('open')
    expect(TaskStatus.AWARDED).toBe('awarded')
    expect(TaskStatus.IN_PROGRESS).toBe('in_progress')
    expect(TaskStatus.SUBMITTED).toBe('submitted')
    expect(TaskStatus.ACCEPTED).toBe('accepted')
    expect(TaskStatus.REJECTED).toBe('rejected')
    expect(TaskStatus.DISPUTED).toBe('disputed')
    expect(TaskStatus.RESOLVED).toBe('resolved')
    expect(TaskStatus.CANCELLED).toBe('cancelled')
  })

  it('bids table has required columns', () => {
    expect(bids.id).toBeDefined()
    expect(bids.taskId).toBeDefined()
    expect(bids.bidderId).toBeDefined()
    expect(bids.price).toBeDefined()
    expect(bids.proposal).toBeDefined()
  })

  it('submissions table has required columns', () => {
    expect(submissions.id).toBeDefined()
    expect(submissions.taskId).toBeDefined()
    expect(submissions.content).toBeDefined()
    expect(submissions.tokensUsed).toBeDefined()
  })

  it('reviews table has required columns', () => {
    expect(reviews.id).toBeDefined()
    expect(reviews.taskId).toBeDefined()
    expect(reviews.reviewerId).toBeDefined()
    expect(reviews.revieweeId).toBeDefined()
    expect(reviews.rating).toBeDefined()
  })

  it('messages table has required columns', () => {
    expect(messages.id).toBeDefined()
    expect(messages.taskId).toBeDefined()
    expect(messages.senderId).toBeDefined()
    expect(messages.content).toBeDefined()
  })
})
