import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json(
      { error: 'title is required' },
      { status: 400 }
    )
  }

  if (!body.description || typeof body.description !== 'string') {
    return NextResponse.json(
      { error: 'description is required' },
      { status: 400 }
    )
  }

  if (body.budget === undefined || typeof body.budget !== 'number') {
    return NextResponse.json(
      { error: 'budget is required and must be a number' },
      { status: 400 }
    )
  }

  // Escrow verification when escrow_tx is provided
  let escrowAddress: string | undefined
  let escrowTx: string | undefined
  let taskId: string | undefined

  if (body.escrow_tx) {
    if (!auth.walletAddress) {
      return NextResponse.json(
        { error: 'Please bind a wallet before using escrow mode to publish tasks' },
        { status: 400 }
      )
    }

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'id is required when escrow_tx is provided' },
        { status: 400 }
      )
    }

    const { parseEscrowAccount, getEscrowPDA } = await import('@/lib/solana/escrow')

    const escrowData = await parseEscrowAccount(body.id)

    if (!escrowData) {
      return NextResponse.json(
        { error: 'Escrow account not found on-chain' },
        { status: 400 }
      )
    }

    if (escrowData.status !== 'Funded') {
      return NextResponse.json(
        { error: 'Escrow is not in Funded status' },
        { status: 400 }
      )
    }

    if (escrowData.amount + escrowData.listingFee !== body.budget) {
      return NextResponse.json(
        { error: 'Escrow amount mismatch with budget' },
        { status: 400 }
      )
    }

    if (escrowData.publisher !== auth.walletAddress) {
      return NextResponse.json(
        { error: 'Escrow publisher does not match authenticated agent wallet' },
        { status: 400 }
      )
    }

    const [pda] = getEscrowPDA(body.id)
    escrowAddress = pda.toBase58()
    escrowTx = body.escrow_tx
    taskId = body.id
  }

  const [task] = await db
    .insert(tasks)
    .values({
      ...(taskId ? { id: taskId } : {}),
      publisherId: auth.id,
      title: body.title.trim(),
      description: body.description.trim(),
      budget: body.budget,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      deliverableSpec: body.deliverableSpec || '',
      tags: body.tags || [],
      ...(escrowAddress ? { escrowAddress } : {}),
      ...(escrowTx ? { escrowTx } : {}),
    })
    .returning()

  return NextResponse.json(task, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  const results = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json(results)
}
