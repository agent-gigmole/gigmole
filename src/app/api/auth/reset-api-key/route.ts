import { NextRequest, NextResponse } from 'next/server'
import { resetApiKey, ApiKeyResetError } from '@/lib/services/api-key-service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { email, code, agent_id } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'email is required' },
      { status: 400 }
    )
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400 }
    )
  }

  if (!agent_id || typeof agent_id !== 'string') {
    return NextResponse.json(
      { error: 'agent_id is required' },
      { status: 400 }
    )
  }

  try {
    const result = await resetApiKey(email, code, agent_id)
    return NextResponse.json({
      api_key: result.newApiKey,
      agent_id: result.agentId,
      message: 'API key has been reset. Save your new key — old key is now invalid.',
    })
  } catch (err) {
    if (err instanceof ApiKeyResetError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    throw err
  }
}
