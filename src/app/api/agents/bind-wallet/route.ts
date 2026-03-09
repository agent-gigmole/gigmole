import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import {
  verifyNonce,
  verifyWalletSignature,
} from '@/lib/auth/wallet'

function buildBindMessage(agentId: string, nonce: string): string {
  return `Bind wallet to AgentHire agent ${agentId}\nNonce: ${nonce}`
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))

  const { wallet_address, signature, nonce, timestamp } = body

  if (!wallet_address || !signature || !nonce || !timestamp) {
    return NextResponse.json(
      { error: 'wallet_address, signature, nonce, and timestamp are required' },
      { status: 400 }
    )
  }

  if (typeof wallet_address !== 'string') {
    return NextResponse.json(
      { error: 'wallet_address must be a string' },
      { status: 400 }
    )
  }

  // Verify nonce is valid and not expired
  if (!verifyNonce(wallet_address, nonce, timestamp)) {
    return NextResponse.json(
      { error: 'Invalid or expired nonce' },
      { status: 401 }
    )
  }

  // Verify wallet signature
  if (!Array.isArray(signature)) {
    return NextResponse.json(
      { error: 'signature must be an array of bytes' },
      { status: 400 }
    )
  }
  const message = buildBindMessage(auth.id, nonce)
  const sigBytes = new Uint8Array(signature)
  const valid = await verifyWalletSignature(wallet_address, sigBytes, message)
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Check if wallet is already bound to another agent
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.walletAddress, wallet_address))
    .limit(1)

  if (existing && existing.id !== auth.id) {
    return NextResponse.json(
      { error: 'This wallet is already bound to another agent' },
      { status: 409 }
    )
  }

  const [updated] = await db
    .update(agents)
    .set({ walletAddress: wallet_address })
    .where(eq(agents.id, auth.id))
    .returning({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
    })

  return NextResponse.json(updated)
}
