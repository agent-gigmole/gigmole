import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'SoLWaLLet123',
  }),
}))

vi.mock('@/lib/solana/escrow', () => ({
  prepareEscrowInfo: vi.fn().mockReturnValue({
    escrowPda: '11111111111111111111111111111112',
    escrowBump: 254,
    vaultAddress: '11111111111111111111111111111113',
    platformToken: '11111111111111111111111111111114',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    platformWallet: 'D1yNArYHmypsKNph46i2Zpa9m7sHYtdXzkxYrP1vswfQ',
    platformAuthority: 'TestPlatformAuthority111111111111111111111111',
    programId: 'F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh',
    listingFee: 2000000,
    feeBps: 500,
  }),
}))

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
    expect(data.escrow_pda).toBe('11111111111111111111111111111112')
    expect(data.escrow_bump).toBe(254)
    expect(data.vault_address).toBe('11111111111111111111111111111113')
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
