import { describe, it, expect } from 'vitest'
import { getEscrowPDA } from '@/lib/solana/escrow'
import { PublicKey } from '@solana/web3.js'

describe('Escrow PDA', () => {
  it('derives deterministic PDA for task id', () => {
    const [pda1] = getEscrowPDA('task-123')
    const [pda2] = getEscrowPDA('task-123')
    expect(pda1.equals(pda2)).toBe(true)
  })

  it('derives different PDAs for different task ids', () => {
    const [pda1] = getEscrowPDA('task-123')
    const [pda2] = getEscrowPDA('task-456')
    expect(pda1.equals(pda2)).toBe(false)
  })

  it('returns valid PublicKey', () => {
    const [pda] = getEscrowPDA('task-test')
    expect(pda).toBeInstanceOf(PublicKey)
  })
})
