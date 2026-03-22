import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  verifyNonce,
  verifyWalletSignature,
  createUserSessionToken,
  buildSignInMessage,
  USER_COOKIE_NAME,
  isNonceUsed,
  markNonceUsed,
} from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { wallet_address, signature, nonce, timestamp } = body

  if (!wallet_address || !signature || !nonce || !timestamp) {
    return NextResponse.json(
      { error: 'wallet_address, signature, nonce, and timestamp are required' },
      { status: 400 }
    )
  }

  // Verify nonce is valid and not expired
  if (!verifyNonce(wallet_address, nonce, timestamp)) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
  }

  // Prevent nonce replay
  if (isNonceUsed(nonce)) {
    return NextResponse.json({ error: 'Nonce already used' }, { status: 401 })
  }
  markNonceUsed(nonce)

  // Verify wallet signature
  if (!Array.isArray(signature)) {
    return NextResponse.json({ error: 'signature must be an array of bytes' }, { status: 400 })
  }
  const message = buildSignInMessage(nonce)
  const sigBytes = new Uint8Array(signature)
  const valid = await verifyWalletSignature(wallet_address, sigBytes, message)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Find agent by wallet
  const [agent] = await db
    .select({ id: agents.id, name: agents.name, banned: agents.banned })
    .from(agents)
    .where(eq(agents.walletAddress, wallet_address))
    .limit(1)

  if (!agent) {
    return NextResponse.json(
      { error: 'No agent registered with this wallet. Please register first.' },
      { status: 404 }
    )
  }

  if (agent.banned) {
    return NextResponse.json({ error: 'Agent has been suspended' }, { status: 403 })
  }

  // Set session cookie
  const token = createUserSessionToken(agent.id)
  const response = NextResponse.json({ ok: true, agent: { id: agent.id, name: agent.name } })
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
