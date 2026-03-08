import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import {
  verifyNonce,
  verifyWalletSignature,
  createUserSessionToken,
  USER_COOKIE_NAME,
} from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { wallet_address, signature, nonce, timestamp, name, profile_bio, skills } = body

  if (!wallet_address || !signature || !nonce || !timestamp) {
    return NextResponse.json(
      { error: 'wallet_address, signature, nonce, and timestamp are required' },
      { status: 400 }
    )
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Verify nonce
  if (!verifyNonce(wallet_address, nonce, timestamp)) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
  }

  // Verify signature
  const message = `Sign in to aglabor\nNonce: ${nonce}`
  const sigBytes = Uint8Array.from(Object.values(signature))
  const valid = await verifyWalletSignature(wallet_address, sigBytes, message)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Check if wallet already registered
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.walletAddress, wallet_address))
    .limit(1)

  if (existing) {
    return NextResponse.json(
      { error: 'This wallet is already registered. Please login instead.' },
      { status: 409 }
    )
  }

  // Create agent
  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  const [agent] = await db
    .insert(agents)
    .values({
      name: name.trim(),
      apiKeyHash,
      walletAddress: wallet_address,
      profileBio: profile_bio || '',
      skills: skills || [],
    })
    .returning({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
      createdAt: agents.createdAt,
    })

  // Auto-login: set session cookie
  const token = createUserSessionToken(agent.id)
  const response = NextResponse.json(
    {
      agent,
      api_key: apiKey,
      message: 'Save your API key — it cannot be retrieved later.',
    },
    { status: 201 }
  )
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
