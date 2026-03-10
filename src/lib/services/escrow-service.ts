import { db } from '@/lib/db'
import { tasks, bids, agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Verify an on-chain escrow deposit matches the task being created.
 * Returns the escrow PDA address (as base58 string) on success.
 * Throws descriptive errors on validation failure.
 */
export async function verifyEscrowDeposit(
  taskId: string,
  publisherWallet: string,
  budget: number,
): Promise<{ escrowAddress: string }> {
  const { parseEscrowAccount, getEscrowPDA } = await import('@/lib/solana/escrow')

  const escrowData = await parseEscrowAccount(taskId)

  if (!escrowData) {
    throw new EscrowVerificationError('Escrow account not found on-chain')
  }

  if (escrowData.status !== 'Funded') {
    throw new EscrowVerificationError('Escrow is not in Funded status')
  }

  if (escrowData.amount + escrowData.listingFee !== budget) {
    throw new EscrowVerificationError('Escrow amount mismatch with budget')
  }

  if (escrowData.publisher !== publisherWallet) {
    throw new EscrowVerificationError('Escrow publisher does not match authenticated agent wallet')
  }

  const [pda] = getEscrowPDA(taskId)
  return { escrowAddress: pda.toBase58() }
}

/**
 * Release escrow funds to the worker upon task acceptance.
 * Looks up the awarded worker's wallet and calls the Solana instruction.
 * Returns the transaction signature, or undefined if release was skipped.
 */
export async function releaseEscrow(
  taskId: string,
  awardedBidId: string,
): Promise<{ releaseTx?: string; walletWarning?: string }> {
  const [bid] = await db
    .select()
    .from(bids)
    .where(eq(bids.id, awardedBidId))
    .limit(1)

  const [worker] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, bid.bidderId))
    .limit(1)

  if (!worker.walletAddress) {
    return {
      walletWarning: 'Worker needs to bind a wallet before receiving payment. Escrow release skipped.',
    }
  }

  const { sendReleaseEscrow } = await import('@/lib/solana/instructions')
  const releaseTx = await sendReleaseEscrow(taskId, worker.walletAddress)
  return { releaseTx }
}

/**
 * Refund escrow funds to the publisher (for reject/cancel).
 * Looks up the publisher's wallet and calls the Solana instruction.
 * Returns the transaction signature, or undefined if publisher has no wallet.
 */
export async function refundEscrow(
  taskId: string,
  publisherId: string,
): Promise<{ refundTx?: string }> {
  const [publisher] = await db
    .select({ walletAddress: agents.walletAddress })
    .from(agents)
    .where(eq(agents.id, publisherId))
    .limit(1)

  if (!publisher?.walletAddress) {
    return {}
  }

  const { sendRefundEscrow } = await import('@/lib/solana/instructions')
  const refundTx = await sendRefundEscrow(taskId, publisher.walletAddress)
  return { refundTx }
}

/**
 * Custom error class for escrow verification failures.
 */
export class EscrowVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EscrowVerificationError'
  }
}
