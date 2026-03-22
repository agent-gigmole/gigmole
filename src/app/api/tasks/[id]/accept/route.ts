import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.publisherId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the publisher can accept deliverables' },
      { status: 403 }
    )
  }

  // P0-2: 幂等性检查 — 如果已有 releaseTx 且状态为 releasing，说明链上已成功，直接完成 DB 更新
  if (task.status === TaskStatus.RELEASING && task.releaseTx) {
    const [updated] = await db
      .update(tasks)
      .set({ status: TaskStatus.ACCEPTED })
      .where(and(eq(tasks.id, id), eq(tasks.status, TaskStatus.RELEASING)))
      .returning()
    return NextResponse.json({ ...updated, releaseTx: task.releaseTx })
  }

  if (!isValidTransition(task.status, TaskStatus.RELEASING)) {
    return NextResponse.json(
      { error: `Cannot accept task with status "${task.status}"` },
      { status: 409 }
    )
  }

  let releaseTx: string | undefined
  let walletWarning: string | undefined

  if (task.escrowAddress && task.awardedBidId) {
    // P0-2: Step 1 — 先设中间状态 'releasing'
    const [releasing] = await db
      .update(tasks)
      .set({ status: TaskStatus.RELEASING })
      .where(and(eq(tasks.id, id), eq(tasks.status, TaskStatus.SUBMITTED)))
      .returning()

    if (!releasing) {
      return NextResponse.json(
        { error: 'Task status changed concurrently, please retry' },
        { status: 409 }
      )
    }

    try {
      const { releaseEscrow } = await import('@/lib/services/escrow-service')
      const result = await releaseEscrow(id, task.awardedBidId)
      releaseTx = result.releaseTx
      walletWarning = result.walletWarning
    } catch (err) {
      // P0-2: Step 3 — 链上失败，回滚到 'submitted'
      await db
        .update(tasks)
        .set({ status: TaskStatus.SUBMITTED })
        .where(eq(tasks.id, id))
      return NextResponse.json(
        { error: 'Escrow release failed on-chain, status rolled back', details: String(err) },
        { status: 502 }
      )
    }

    // HIGH-06: walletWarning 时回滚状态，保持 SUBMITTED
    if (walletWarning) {
      await db
        .update(tasks)
        .set({ status: TaskStatus.SUBMITTED })
        .where(eq(tasks.id, id))
      return NextResponse.json({
        ...task,
        walletWarning,
      })
    }

    // P0-2: Step 2 — 链上成功，记录 tx signature 并更新为 'accepted'
    // Step 4 — releaseTx 存入 DB 供幂等性检查
    const [updated] = await db
      .update(tasks)
      .set({ status: TaskStatus.ACCEPTED, releaseTx })
      .where(and(eq(tasks.id, id), eq(tasks.status, TaskStatus.RELEASING)))
      .returning()

    return NextResponse.json({
      ...updated,
      releaseTx,
    })
  }

  // 无 escrow 的情况，直接 accept
  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.ACCEPTED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({
    ...updated,
    releaseTx,
  })
}
