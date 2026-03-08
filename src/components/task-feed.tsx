'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  budget: number
  tags: string[]
  createdAt: string
}

function formatUSDC(budget: number): string {
  return `${(budget / 1_000_000).toFixed(2)} USDC`
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  )
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function TaskFeed() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks?limit=5')
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : data.tasks ?? [])
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-stone-900">Latest Tasks</h2>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-stone-400">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-stone-400">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">
                    {task.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(task.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm sm:flex-shrink-0">
                  <span className="font-mono font-medium text-[#D97757]">
                    {formatUSDC(task.budget)}
                  </span>
                  <span className="text-stone-400">{timeAgo(task.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tasks"
            className="text-sm font-medium text-[#D97757] transition hover:text-[#C4684A]"
          >
            View All Tasks &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
