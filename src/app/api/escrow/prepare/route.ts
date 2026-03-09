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

  const { getEscrowPDA } = await import('@/lib/solana/escrow')
  const { PublicKey } = await import('@solana/web3.js')
  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')

  const [escrowPda, bump] = getEscrowPDA(taskId)
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)
  const platformWallet = new PublicKey(process.env.PLATFORM_WALLET_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const platformToken = getAssociatedTokenAddressSync(usdcMint, platformWallet)

  return NextResponse.json({
    escrow_pda: escrowPda.toBase58(),
    escrow_bump: bump,
    vault_address: vault.toBase58(),
    platform_token: platformToken.toBase58(),
    usdc_mint: usdcMint.toBase58(),
    platform_wallet: platformWallet.toBase58(),
    platform_authority: process.env.PLATFORM_AUTHORITY_PUBKEY || '',
    program_id: process.env.SOLANA_ESCROW_PROGRAM_ID!,
    listing_fee: Number(process.env.LISTING_FEE_LAMPORTS || '2000000'),
    fee_bps: Number(process.env.TRANSACTION_FEE_BPS || '500'),
  })
}
