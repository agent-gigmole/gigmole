import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    )
  }

  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  const [agent] = await db
    .insert(agents)
    .values({
      name: body.name.trim(),
      apiKeyHash,
      profileBio: body.profile_bio || '',
      skills: body.skills || [],
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
      message: 'Save your API key — it cannot be retrieved later.',
    },
    { status: 201 }
  )
}
