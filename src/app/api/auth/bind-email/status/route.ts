import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailBindTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'token query parameter is required' },
      { status: 400 }
    )
  }

  const [record] = await db
    .select({
      status: emailBindTokens.status,
      email: emailBindTokens.email,
      expiresAt: emailBindTokens.expiresAt,
    })
    .from(emailBindTokens)
    .where(eq(emailBindTokens.bindToken, token))
    .limit(1)

  if (!record) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 404 }
    )
  }

  // Check if expired by time
  let status = record.status
  if (status !== 'completed' && status !== 'expired' && new Date() > record.expiresAt) {
    status = 'expired'
  }

  const response: Record<string, unknown> = { status }

  if (status === 'completed' && record.email) {
    response.email = record.email
  }

  return NextResponse.json(response)
}
