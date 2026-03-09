import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { connection } from './client'
import { getPlatformAuthority } from './platform-authority'
import { getEscrowPDA } from './escrow'

const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_ESCROW_PROGRAM_ID || '11111111111111111111111111111111'
)

const RELEASE_DISCRIMINATOR = Buffer.from([146, 253, 129, 233, 20, 145, 181, 206])
const REFUND_DISCRIMINATOR = Buffer.from([107, 186, 89, 99, 26, 194, 23, 204])

function serializeBorshString(s: string): Buffer {
  const bytes = Buffer.from(s, 'utf-8')
  const len = Buffer.alloc(4)
  len.writeUInt32LE(bytes.length, 0)
  return Buffer.concat([len, bytes])
}

export interface ReleaseParams {
  taskId: string
  escrowPda: PublicKey
  platformAuthority: PublicKey
  vault: PublicKey
  workerToken: PublicKey
  platformToken: PublicKey
}

export function buildReleaseInstruction(params: ReleaseParams): TransactionInstruction {
  const data = Buffer.concat([
    RELEASE_DISCRIMINATOR,
    serializeBorshString(params.taskId),
  ])

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: params.escrowPda, isSigner: false, isWritable: true },
      { pubkey: params.platformAuthority, isSigner: true, isWritable: false },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: params.workerToken, isSigner: false, isWritable: true },
      { pubkey: params.platformToken, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

export interface RefundParams {
  taskId: string
  escrowPda: PublicKey
  platformAuthority: PublicKey
  vault: PublicKey
  publisherToken: PublicKey
}

export function buildRefundInstruction(params: RefundParams): TransactionInstruction {
  const data = Buffer.concat([
    REFUND_DISCRIMINATOR,
    serializeBorshString(params.taskId),
  ])

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: params.escrowPda, isSigner: false, isWritable: true },
      { pubkey: params.platformAuthority, isSigner: true, isWritable: false },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: params.publisherToken, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

export async function sendReleaseEscrow(
  taskId: string,
  workerWallet: PublicKey,
): Promise<string> {
  const authority = getPlatformAuthority()
  const [escrowPda] = getEscrowPDA(taskId)
  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const workerToken = getAssociatedTokenAddressSync(usdcMint, workerWallet)
  const platformWallet = new PublicKey(process.env.PLATFORM_WALLET_ADDRESS!)
  const platformToken = getAssociatedTokenAddressSync(usdcMint, platformWallet)

  const ix = buildReleaseInstruction({
    taskId,
    escrowPda,
    platformAuthority: authority.publicKey,
    vault,
    workerToken,
    platformToken,
  })

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirmTransaction(connection, tx, [authority])
  return sig
}

export async function sendRefundEscrow(
  taskId: string,
  publisherWallet: PublicKey,
): Promise<string> {
  const authority = getPlatformAuthority()
  const [escrowPda] = getEscrowPDA(taskId)
  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const publisherToken = getAssociatedTokenAddressSync(usdcMint, publisherWallet)

  const ix = buildRefundInstruction({
    taskId,
    escrowPda,
    platformAuthority: authority.publicKey,
    vault,
    publisherToken,
  })

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirmTransaction(connection, tx, [authority])
  return sig
}
