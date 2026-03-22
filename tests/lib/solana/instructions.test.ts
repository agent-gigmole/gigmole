import { describe, it, expect, vi } from 'vitest'
import { PublicKey, Keypair } from '@solana/web3.js'

vi.hoisted(() => {
  process.env.SOLANA_ESCROW_PROGRAM_ID = 'F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh'
})

vi.mock('@/lib/solana/client', () => ({
  connection: {
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'FakeBlockhash111111111111111111111111111111111',
      lastValidBlockHeight: 100,
    }),
    sendRawTransaction: vi.fn().mockResolvedValue('fakeTxSig123'),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  },
}))

vi.mock('@/lib/solana/platform-authority', () => ({
  getPlatformAuthority: vi.fn().mockReturnValue(Keypair.generate()),
}))

vi.mock('@/lib/solana/escrow', () => ({
  getEscrowPDA: vi.fn().mockReturnValue([PublicKey.unique(), 255]),
}))

import { buildReleaseInstruction, buildRefundInstruction } from '@/lib/solana/instructions'

describe('buildReleaseInstruction', () => {
  it('builds a release instruction with correct accounts', () => {
    const escrowPda = PublicKey.unique()
    const platformAuth = Keypair.generate().publicKey
    const usdcMint = PublicKey.unique()
    const vault = PublicKey.unique()
    const workerToken = PublicKey.unique()
    const platformToken = PublicKey.unique()

    const ix = buildReleaseInstruction({
      taskId: 'task-123',
      escrowPda,
      platformAuthority: platformAuth,
      usdcMint,
      vault,
      workerToken,
      platformToken,
    })

    expect(ix.keys).toHaveLength(7)
    expect(ix.keys[0].pubkey.equals(escrowPda)).toBe(true)
    expect(ix.keys[0].isWritable).toBe(true)
    expect(ix.keys[0].isSigner).toBe(false)
    expect(ix.keys[1].pubkey.equals(platformAuth)).toBe(true)
    expect(ix.keys[1].isSigner).toBe(true)
    expect(ix.keys[2].pubkey.equals(usdcMint)).toBe(true)
    expect(ix.keys[3].pubkey.equals(vault)).toBe(true)
    expect(ix.keys[3].isWritable).toBe(true)
    expect(ix.keys[4].pubkey.equals(workerToken)).toBe(true)
    expect(ix.keys[5].pubkey.equals(platformToken)).toBe(true)
  })

  it('serializes task_id in instruction data', () => {
    const ix = buildReleaseInstruction({
      taskId: 'my-task',
      escrowPda: PublicKey.unique(),
      platformAuthority: Keypair.generate().publicKey,
      usdcMint: PublicKey.unique(),
      vault: PublicKey.unique(),
      workerToken: PublicKey.unique(),
      platformToken: PublicKey.unique(),
    })

    // 8 bytes discriminator + 4 bytes string length + 7 bytes "my-task"
    expect(ix.data.length).toBe(8 + 4 + 7)
  })
})

describe('buildRefundInstruction', () => {
  it('builds a refund instruction with correct accounts', () => {
    const escrowPda = PublicKey.unique()
    const platformAuth = Keypair.generate().publicKey
    const usdcMint = PublicKey.unique()
    const vault = PublicKey.unique()
    const publisherToken = PublicKey.unique()

    const ix = buildRefundInstruction({
      taskId: 'task-456',
      escrowPda,
      platformAuthority: platformAuth,
      usdcMint,
      vault,
      publisherToken,
    })

    expect(ix.keys).toHaveLength(6)
    expect(ix.keys[0].pubkey.equals(escrowPda)).toBe(true)
    expect(ix.keys[0].isWritable).toBe(true)
    expect(ix.keys[1].pubkey.equals(platformAuth)).toBe(true)
    expect(ix.keys[1].isSigner).toBe(true)
    expect(ix.keys[2].pubkey.equals(usdcMint)).toBe(true)
    expect(ix.keys[3].pubkey.equals(vault)).toBe(true)
    expect(ix.keys[4].pubkey.equals(publisherToken)).toBe(true)
  })

  it('serializes task_id in instruction data', () => {
    const ix = buildRefundInstruction({
      taskId: 'my-task',
      escrowPda: PublicKey.unique(),
      platformAuthority: Keypair.generate().publicKey,
      usdcMint: PublicKey.unique(),
      vault: PublicKey.unique(),
      publisherToken: PublicKey.unique(),
    })

    // 8 bytes discriminator + 4 bytes string length + 7 bytes "my-task"
    expect(ix.data.length).toBe(8 + 4 + 7)
  })
})
