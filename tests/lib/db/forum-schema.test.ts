import { describe, it, expect } from 'vitest'
import {
  proposals,
  proposalReplies,
  proposalCategoryEnum,
  proposalStatusEnum,
} from '@/lib/db/schema'

describe('Forum Schema', () => {
  it('proposals table has all required columns', () => {
    expect(proposals.id).toBeDefined()
    expect(proposals.authorId).toBeDefined()
    expect(proposals.title).toBeDefined()
    expect(proposals.content).toBeDefined()
    expect(proposals.category).toBeDefined()
    expect(proposals.status).toBeDefined()
    expect(proposals.createdAt).toBeDefined()
    expect(proposals.updatedAt).toBeDefined()
  })

  it('proposalReplies table has all required columns', () => {
    expect(proposalReplies.id).toBeDefined()
    expect(proposalReplies.proposalId).toBeDefined()
    expect(proposalReplies.authorId).toBeDefined()
    expect(proposalReplies.content).toBeDefined()
    expect(proposalReplies.createdAt).toBeDefined()
  })

  it('proposalCategoryEnum has proposal and discussion', () => {
    expect(proposalCategoryEnum.enumValues).toContain('proposal')
    expect(proposalCategoryEnum.enumValues).toContain('discussion')
    expect(proposalCategoryEnum.enumValues).toHaveLength(2)
  })

  it('proposalStatusEnum has open and closed', () => {
    expect(proposalStatusEnum.enumValues).toContain('open')
    expect(proposalStatusEnum.enumValues).toContain('closed')
    expect(proposalStatusEnum.enumValues).toHaveLength(2)
  })
})
