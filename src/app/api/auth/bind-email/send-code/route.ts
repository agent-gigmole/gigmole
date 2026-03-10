import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode, EmailBindError } from '@/lib/services/email-bind-service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { bind_token, email } = body

  if (!bind_token || typeof bind_token !== 'string') {
    return NextResponse.json(
      { error: 'bind_token is required' },
      { status: 400 }
    )
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'email is required' },
      { status: 400 }
    )
  }

  try {
    const result = await sendVerificationCode(bind_token, email)
    return NextResponse.json({
      message: 'Verification code sent',
      email: result.email,
      expires_in: result.expiresIn,
    })
  } catch (err) {
    if (err instanceof EmailBindError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    throw err
  }
}
