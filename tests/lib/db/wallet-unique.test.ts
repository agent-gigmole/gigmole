import { describe, it, expect } from 'vitest'
import { agents } from '@/lib/db/schema'

describe('agents schema wallet constraint', () => {
  it('walletAddress has unique constraint', () => {
    const walletCol = agents.walletAddress
    expect(walletCol.isUnique).toBe(true)
  })
})
