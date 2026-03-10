import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { createBindRequest, EmailBindError } from '@/lib/services/email-bind-service'

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult
  const agent = authResult

  try {
    const result = await createBindRequest(agent.id)
    return NextResponse.json({
      bind_token: result.bindToken,
      bind_url: result.bindUrl,
      expires_in: result.expiresIn,
    })
  } catch (err) {
    if (err instanceof EmailBindError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    throw err
  }
}
