import { describe, it, expect, vi, beforeAll } from 'vitest'
import { PublicKey } from '@solana/web3.js'

vi.hoisted(() => {
  process.env.SOLANA_ESCROW_PROGRAM_ID = 'F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh'
})

vi.mock('@/lib/solana/client', () => ({
  connection: {
    getAccountInfo: vi.fn(),
  },
}))

import { getEscrowPDA } from '@/lib/solana/escrow'

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

describe('parseEscrowAccount', () => {
  it('parses a funded escrow account correctly', async () => {
    const { parseEscrowAccount } = await import('@/lib/solana/escrow')
    const { connection } = await import('@/lib/solana/client')

    const publisher = PublicKey.unique()
    const platformAuth = PublicKey.unique()
    const usdcMint = PublicKey.unique()
    const taskId = 'test-task-123'

    const discriminator = Buffer.alloc(8)
    const amount = Buffer.alloc(8)
    amount.writeBigUInt64LE(5000000n)
    const listingFee = Buffer.alloc(8)
    listingFee.writeBigUInt64LE(2000000n)
    const feeBps = Buffer.alloc(2)
    feeBps.writeUInt16LE(500)
    const taskIdBytes = Buffer.from(taskId, 'utf-8')
    const taskIdLen = Buffer.alloc(4)
    taskIdLen.writeUInt32LE(taskIdBytes.length)
    const status = Buffer.from([0]) // Funded
    const worker = PublicKey.unique()
    const bump = Buffer.from([255])

    const data = Buffer.concat([
      discriminator,
      publisher.toBuffer(),
      platformAuth.toBuffer(),
      usdcMint.toBuffer(),
      amount,
      listingFee,
      feeBps,
      taskIdLen,
      taskIdBytes,
      status,
      worker.toBuffer(),
      bump,
    ])

    vi.mocked(connection.getAccountInfo).mockResolvedValue({
      data,
      executable: false,
      lamports: 1000000,
      owner: new PublicKey('F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh'),
    } as any)

    const result = await parseEscrowAccount(taskId)
    expect(result).not.toBeNull()
    expect(result!.publisher).toBe(publisher.toBase58())
    expect(result!.platformAuthority).toBe(platformAuth.toBase58())
    expect(result!.usdcMint).toBe(usdcMint.toBase58())
    expect(result!.amount).toBe(5000000)
    expect(result!.listingFee).toBe(2000000)
    expect(result!.feeBps).toBe(500)
    expect(result!.taskId).toBe(taskId)
    expect(result!.status).toBe('Funded')
    expect(result!.worker).toBe(worker.toBase58())
    expect(result!.bump).toBe(255)
  })

  it('returns null for non-existent account', async () => {
    const { parseEscrowAccount } = await import('@/lib/solana/escrow')
    const { connection } = await import('@/lib/solana/client')
    vi.mocked(connection.getAccountInfo).mockResolvedValue(null)

    const result = await parseEscrowAccount('nonexistent-task')
    expect(result).toBeNull()
  })
})
