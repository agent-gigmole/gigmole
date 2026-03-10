import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { connection } from './client'

const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_ESCROW_PROGRAM_ID || '11111111111111111111111111111111'
)

export function getEscrowPDA(taskId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(taskId)],
    PROGRAM_ID
  )
}

export async function getEscrowAccount(taskId: string) {
  const [pda] = getEscrowPDA(taskId)
  const accountInfo = await connection.getAccountInfo(pda)
  return accountInfo
}

export interface EscrowData {
  publisher: string
  platformAuthority: string
  amount: number
  listingFee: number
  feeBps: number
  taskId: string
  status: 'Funded' | 'Released' | 'Refunded'
  bump: number
}

const STATUS_MAP: Record<number, EscrowData['status']> = {
  0: 'Funded',
  1: 'Released',
  2: 'Refunded',
}

export async function parseEscrowAccount(
  taskId: string
): Promise<EscrowData | null> {
  const accountInfo = await getEscrowAccount(taskId)
  if (!accountInfo) return null

  const data = accountInfo.data as Buffer
  let offset = 8 // skip Anchor discriminator

  const publisher = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
  offset += 32

  const platformAuthority = new PublicKey(
    data.subarray(offset, offset + 32)
  ).toBase58()
  offset += 32

  const amount = Number(data.readBigUInt64LE(offset))
  offset += 8

  const listingFee = Number(data.readBigUInt64LE(offset))
  offset += 8

  const feeBps = data.readUInt16LE(offset)
  offset += 2

  const taskIdLen = data.readUInt32LE(offset)
  offset += 4
  const parsedTaskId = data.subarray(offset, offset + taskIdLen).toString('utf-8')
  offset += taskIdLen

  const statusByte = data[offset]
  offset += 1
  const status = STATUS_MAP[statusByte] ?? 'Funded'

  const bump = data[offset]

  return {
    publisher,
    platformAuthority,
    amount,
    listingFee,
    feeBps,
    taskId: parsedTaskId,
    status,
    bump,
  }
}

/**
 * Prepare escrow info for a given publisher wallet and task ID.
 * Handles all PDA derivation and token address computation.
 * Accepts string addresses — no @solana/web3.js needed by callers.
 */
export interface EscrowInfo {
  escrowPda: string
  escrowBump: number
  vaultAddress: string
  platformToken: string
  usdcMint: string
  platformWallet: string
  platformAuthority: string
  programId: string
  listingFee: number
  feeBps: number
}

export function prepareEscrowInfo(publisherWallet: string, taskId: string): EscrowInfo {
  const [escrowPda, bump] = getEscrowPDA(taskId)
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)
  const platformWallet = new PublicKey(process.env.PLATFORM_WALLET_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const platformToken = getAssociatedTokenAddressSync(usdcMint, platformWallet)

  return {
    escrowPda: escrowPda.toBase58(),
    escrowBump: bump,
    vaultAddress: vault.toBase58(),
    platformToken: platformToken.toBase58(),
    usdcMint: usdcMint.toBase58(),
    platformWallet: platformWallet.toBase58(),
    platformAuthority: process.env.PLATFORM_AUTHORITY_PUBKEY || '',
    programId: process.env.SOLANA_ESCROW_PROGRAM_ID!,
    listingFee: Number(process.env.LISTING_FEE_LAMPORTS || '2000000'),
    feeBps: Number(process.env.TRANSACTION_FEE_BPS || '500'),
  }
}
