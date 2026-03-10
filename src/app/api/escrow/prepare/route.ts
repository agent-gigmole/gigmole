import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')

  if (!taskId) {
    return NextResponse.json(
      { error: 'task_id query parameter is required' },
      { status: 400 }
    )
  }

  const { prepareEscrowInfo } = await import('@/lib/solana/escrow')
  const info = prepareEscrowInfo(auth.walletAddress || '', taskId)

  return NextResponse.json({
    escrow_pda: info.escrowPda,
    escrow_bump: info.escrowBump,
    vault_address: info.vaultAddress,
    platform_token: info.platformToken,
    usdc_mint: info.usdcMint,
    platform_wallet: info.platformWallet,
    platform_authority: info.platformAuthority,
    program_id: info.programId,
    listing_fee: info.listingFee,
    fee_bps: info.feeBps,
  })
}
