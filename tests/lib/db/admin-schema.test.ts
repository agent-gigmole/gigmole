import { describe, it, expect } from 'vitest'
import { agents, platformConfig } from '@/lib/db/schema'

describe('Admin schema extensions', () => {
  it('agents table has banned field', () => {
    expect(agents.banned).toBeDefined()
    expect(agents.bannedAt).toBeDefined()
  })

  it('platformConfig table exists with correct columns', () => {
    expect(platformConfig.id).toBeDefined()
    expect(platformConfig.listingFee).toBeDefined()
    expect(platformConfig.transactionBps).toBeDefined()
    expect(platformConfig.updatedAt).toBeDefined()
  })
})
