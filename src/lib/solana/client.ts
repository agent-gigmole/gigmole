import { Connection, clusterApiUrl } from '@solana/web3.js'

const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet')
export const connection = new Connection(RPC_URL, 'confirmed')
