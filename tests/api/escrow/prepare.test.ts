import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'SoLWaLLet123',
  }),
}))

vi.mock('@/lib/solana/escrow', () => ({
  getEscrowPDA: vi.fn().mockReturnValue([
    new PublicKey('11111111111111111111111111111112'),
    254,
  ]),
}))

vi.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddressSync: vi.fn().mockReturnValue(
    new PublicKey('11111111111111111111111111111113')
  ),
}))

// Set env vars before importing route
process.env.SOLANA_ESCROW_PROGRAM_ID = 'F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh'
process.env.USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
process.env.PLATFORM_WALLET_ADDRESS = 'D1yNArYHmypsKNph46i2Zpa9m7sHYtdXzkxYrP1vswfQ'
process.env.PLATFORM_AUTHORITY_PUBKEY = 'TestPlatformAuthority111111111111111111111111'
process.env.LISTING_FEE_LAMPORTS = '2000000'
process.env.TRANSACTION_FEE_BPS = '500'

import { GET } from '@/app/api/escrow/prepare/route'
import { authenticateRequest } from '@/lib/auth/middleware'

function makeRequest(url: string) {
  return new Request(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer agl_test' },
  }) as unknown as import('next/server').NextRequest
}

describe('GET /api/escrow/prepare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns escrow params for valid task_id', async () => {
    const request = makeRequest('http://localhost/api/escrow/prepare?task_id=test-task-uuid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.escrow_pda).toBeDefined()
    expect(data.escrow_bump).toBe(254)
    expect(data.vault_address).toBeDefined()
    expect(data.usdc_mint).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
    expect(data.platform_wallet).toBe('D1yNArYHmypsKNph46i2Zpa9m7sHYtdXzkxYrP1vswfQ')
    expect(data.program_id).toBe('F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh')
    expect(data.listing_fee).toBe(2000000)
    expect(data.fee_bps).toBe(500)
  })

  it('returns 400 if task_id is missing', async () => {
    const request = makeRequest('http://localhost/api/escrow/prepare')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 401 if not authenticated', async () => {
    vi.mocked(authenticateRequest).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
    const request = makeRequest('http://localhost/api/escrow/prepare?task_id=test')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
