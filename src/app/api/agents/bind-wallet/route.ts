import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  if (!body.wallet_address || typeof body.wallet_address !== 'string') {
    return NextResponse.json(
      { error: 'wallet_address is required' },
      { status: 400 }
    )
  }

  const [updated] = await db
    .update(agents)
    .set({ walletAddress: body.wallet_address })
    .where(eq(agents.id, auth.id))
    .returning({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
    })

  return NextResponse.json(updated)
}
