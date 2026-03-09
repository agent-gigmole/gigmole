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
