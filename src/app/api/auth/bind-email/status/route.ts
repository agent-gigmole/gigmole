import { NextRequest, NextResponse } from 'next/server'
import { getBindStatus, EmailBindError } from '@/lib/services/email-bind-service'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'token query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const result = await getBindStatus(token)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof EmailBindError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    throw err
  }
}
