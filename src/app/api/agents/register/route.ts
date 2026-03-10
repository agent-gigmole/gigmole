import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import { isValidEmail } from '@/lib/services/verification-utils'
import { findOrCreateUserByEmail } from '@/lib/services/user-service'
import { validateReferrer, ReferrerValidationError } from '@/lib/services/agent-service'

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
    try {
      const result = await validateReferrer(body.referred_by)
      referredBy = result.referrerId
    } catch (err) {
      if (err instanceof ReferrerValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      throw err
    }
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

  return NextResponse.json(
    {
      id: agent.id,
      name: agent.name,
      api_key: apiKey,
      created_at: agent.createdAt,
      message: 'Save your API key — it cannot be retrieved later. Bind an email to enable recovery.',
    },
    { status: 201 }
  )
}
