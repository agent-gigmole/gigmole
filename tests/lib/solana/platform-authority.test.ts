import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Platform Authority', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('loads keypair from PLATFORM_AUTHORITY_KEYPAIR env var', async () => {
    const { Keypair } = await import('@solana/web3.js')
    const testKeypair = Keypair.generate()
    const bs58 = await import('bs58')
    process.env.PLATFORM_AUTHORITY_KEYPAIR = bs58.default.encode(testKeypair.secretKey)

    const { getPlatformAuthority } = await import('@/lib/solana/platform-authority')
    const loaded = getPlatformAuthority()

    expect(loaded.publicKey.toBase58()).toBe(testKeypair.publicKey.toBase58())
  })

  it('throws if PLATFORM_AUTHORITY_KEYPAIR is not set', async () => {
    delete process.env.PLATFORM_AUTHORITY_KEYPAIR

    const { getPlatformAuthority } = await import('@/lib/solana/platform-authority')
    expect(() => getPlatformAuthority()).toThrow('PLATFORM_AUTHORITY_KEYPAIR')
  })
})
