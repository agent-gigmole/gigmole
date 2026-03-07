import { PublicKey } from '@solana/web3.js'
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
