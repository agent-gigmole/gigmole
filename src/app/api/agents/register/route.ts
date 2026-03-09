import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import { isValidEmail } from '@/lib/services/email-verification-service'
import { findOrCreateUserByEmail } from '@/lib/services/user-service'
import { sendVerificationEmail } from '@/lib/email/resend'
import {
  generateVerificationCode,
  hashCode,
} from '@/lib/services/email-verification-service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    )
  }

  // Validate email if provided
  let email: string | null = null
  if (body.email) {
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    email = body.email
  }

  // Validate referred_by if provided
  let referredBy: string | null = null
  if (body.referred_by) {
    const [referrer] = await db
      .select({ id: agents.id, banned: agents.banned })
      .from(agents)
      .where(eq(agents.id, body.referred_by))
      .limit(1)

    if (!referrer) {
      return NextResponse.json(
        { error: 'Referrer agent not found' },
        { status: 400 }
      )
    }
    if (referrer.banned) {
      return NextResponse.json(
        { error: 'Referrer agent is suspended' },
        { status: 400 }
      )
    }
    referredBy = referrer.id
  }

  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  // If email provided, create user first
  let ownerId: string | null = null
  if (email) {
    const user = await findOrCreateUserByEmail(email)
    ownerId = user.id
  }

  const [agent] = await db
    .insert(agents)
    .values({
      name: body.name.trim(),
      apiKeyHash,
      profileBio: body.profile_bio || '',
      skills: body.skills || [],
      referredBy,
      ownerId,
    })
    .returning({
      id: agents.id,
      name: agents.name,
      createdAt: agents.createdAt,
    })

  // Send verification email if email provided
  let emailHint: string | undefined
  if (email) {
    const code = generateVerificationCode()
    await sendVerificationEmail(email, code)
    emailHint = 'Verification email sent. Bind your email to enable API key recovery.'
  }

  return NextResponse.json(
    {
      id: agent.id,
      name: agent.name,
      api_key: apiKey,
      created_at: agent.createdAt,
      message: emailHint || 'Save your API key — it cannot be retrieved later. Bind an email to enable recovery.',
    },
    { status: 201 }
  )
}
