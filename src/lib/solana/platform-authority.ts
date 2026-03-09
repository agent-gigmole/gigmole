import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

export function getPlatformAuthority(): Keypair {
  const encoded = process.env.PLATFORM_AUTHORITY_KEYPAIR
  if (!encoded) {
    throw new Error(
      'PLATFORM_AUTHORITY_KEYPAIR environment variable is required. ' +
      'Set it to the base58-encoded secret key of the platform authority.'
    )
  }
  const secretKey = bs58.decode(encoded)
  return Keypair.fromSecretKey(secretKey)
}
