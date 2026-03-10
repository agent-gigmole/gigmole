import { NextRequest, NextResponse } from 'next/server'
import { verifyCode, EmailBindError } from '@/lib/services/email-bind-service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { bind_token, code } = body

  if (!bind_token || typeof bind_token !== 'string') {
    return NextResponse.json(
      { error: 'bind_token is required' },
      { status: 400 }
    )
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400 }
    )
  }

  try {
    const result = await verifyCode(bind_token, code)
    return NextResponse.json({
      message: 'Email bound successfully',
      email: result.email,
      user_id: result.userId,
    })
  } catch (err) {
    if (err instanceof EmailBindError) {
      return NextResponse.json(
        { error: err.message, ...err.extra },
        { status: err.statusCode }
      )
    }
    throw err
  }
}
