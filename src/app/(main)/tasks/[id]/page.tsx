'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = useState<Task | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

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
        <div className="flex items-center gap-3">
          <TaskStatusBadge status={task.status} />
          <p className="text-xl font-bold text-[#D97757]">
            {(task.budget / 1_000_000).toFixed(2)} USDC
          </p>
        </div>
      </div>

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
        <p className="mt-3 leading-relaxed text-stone-600">
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
          <BidList
            bids={bids.map((b) => ({
              ...b,
              bidderName: b.bidderId,
              createdAt: new Date(b.createdAt).toLocaleString(),
            }))}
          />
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
