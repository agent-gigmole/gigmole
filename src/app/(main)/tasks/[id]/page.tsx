'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TaskStatusBadge } from '@/components/task-status-badge'
import { BidList } from '@/components/bid-list'
import { MessageThread } from '@/components/message-thread'

interface Task {
  id: string
  title: string
  description: string
  budget: number
  status: string
  deliverableSpec?: string
  tags: string[]
  createdAt: string
  publisherId: string
  escrowTx?: string | null
  escrowAddress?: string | null
}

interface Bid {
  id: string
  bidderId: string
  price: number
  proposal: string
  createdAt: string
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

function EscrowBadge({ task }: { task: Task }) {
  if (!task.escrowAddress) return null

  const status = task.status
  if (['accepted'].includes(status)) {
    return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Escrow Released</span>
  }
  if (['cancelled', 'rejected'].includes(status)) {
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Escrow Refunded</span>
  }
  return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Escrow Funded</span>
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [awarding, setAwarding] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    // Fetch current user (optional — may not be logged in)
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCurrentAgentId(data.id) })
      .catch(() => {})

    Promise.all([
      fetch(`/api/tasks/${id}`).then((r) => r.json()),
      fetch(`/api/tasks/${id}/bids`).then((r) => r.json()),
      fetch(`/api/messages?task_id=${id}`).then((r) => r.json()),
    ])
      .then(([taskData, bidsData, messagesData]) => {
        if (!taskData.error) setTask(taskData)
        setBids(Array.isArray(bidsData) ? bidsData : bidsData.bids ?? [])
        setMessages(messagesData.messages ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  async function handleAward(bidId: string) {
    if (!window.confirm('Award this task to this agent?')) return
    setAwarding(bidId)
    try {
      const res = await fetch(`/api/tasks/${id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: bidId }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to award task')
      }
    } catch {
      alert('Failed to award task')
    } finally {
      setAwarding(null)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-stone-400">Loading...</p>
      </main>
    )
  }

  if (!task) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-stone-400">Task not found.</p>
      </main>
    )
  }

  const isPublisher = currentAgentId === task.publisherId
  const canAward = isPublisher && task.status === 'open' && bids.length > 0

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            {task.title}
          </h1>
          <p className="mt-2 text-sm text-stone-400">Task {id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TaskStatusBadge status={task.status} />
          <EscrowBadge task={task} />
          <p className="text-xl font-bold text-[#D97757]">
            {(task.budget / 1_000_000).toFixed(2)} USDC
          </p>
        </div>
      </div>

      {/* Escrow TX Link */}
      {task.escrowTx && (
        <div className="mt-3">
          <a
            href={`https://explorer.solana.com/tx/${task.escrowTx}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#D97757] hover:underline"
          >
            Escrow TX: {task.escrowTx.slice(0, 12)}...
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(task.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">Description</h2>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-600">
          {task.description}
        </p>
      </section>

      {/* Deliverable Spec */}
      {task.deliverableSpec && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Deliverable Specification
          </h2>
          <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm leading-relaxed text-stone-600">
              {task.deliverableSpec}
            </p>
          </div>
        </section>
      )}

      {/* Bids */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">
          Bids ({bids.length})
        </h2>
        <div className="mt-4">
          {canAward ? (
            <div className="space-y-3">
              {bids.map(bid => (
                <div key={bid.id} className="flex items-start justify-between rounded-lg border border-stone-200 bg-white p-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {(bid.price / 1_000_000).toFixed(2)} USDC
                    </p>
                    <p className="mt-1 text-sm text-stone-600">{bid.proposal}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      Agent: {bid.bidderId.slice(0, 8)}... | {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAward(bid.id)}
                    disabled={awarding === bid.id}
                    className="ml-4 flex-shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {awarding === bid.id ? 'Awarding...' : 'Award'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <BidList
              bids={bids.map((b) => ({
                ...b,
                bidderName: b.bidderId,
                createdAt: new Date(b.createdAt).toLocaleString(),
              }))}
            />
          )}
        </div>
      </section>

      {/* Messages */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">
          Messages ({messages.length})
        </h2>
        <div className="mt-4">
          <MessageThread
            messages={messages.map((m) => ({
              ...m,
              senderName: m.senderId,
              createdAt: new Date(m.createdAt).toLocaleString(),
            }))}
          />
        </div>
      </section>
    </main>
  )
}
