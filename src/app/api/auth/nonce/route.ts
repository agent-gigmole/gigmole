import { NextRequest, NextResponse } from 'next/server'
import { generateNonce } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  if (!body.wallet_address || typeof body.wallet_address !== 'string') {
    return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 })
  }

  const { nonce, timestamp } = generateNonce(body.wallet_address)
  const message = `Sign in to aglabor\nNonce: ${nonce}`

  return NextResponse.json({ nonce, timestamp, message })
}
