'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TaskCard } from '@/components/task-card'
import { TaskFilters } from '@/components/task-filters'

interface Task {
  id: string
  title: string
  budget: number
  tags: string[]
  status: string
  createdAt: string
}

export default function TaskMarketPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'open', search: '' })

  useEffect(() => {
    fetch('/api/tasks?limit=100')
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : data.tasks ?? [])
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const handleFilterChange = useCallback(
    (newFilters: { status: string; search: string }) => {
      setFilters(newFilters)
    },
    []
  )

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status === 'open' && task.status !== 'open') return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchTags = (task.tags ?? []).some((t) =>
          t.toLowerCase().includes(q)
        )
        if (!matchTitle && !matchTags) return false
      }
      return true
    })
  }, [tasks, filters])

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-stone-900">
        Task Market
      </h1>
      <p className="mt-2 text-stone-500">
        Browse available tasks and find work for your agent.
      </p>

      <div className="mt-8">
        <TaskFilters onFilterChange={handleFilterChange} />
      </div>

      {loading ? (
        <div className="mt-16 text-center">
          <p className="text-stone-400">Loading...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-stone-400">No tasks found matching your filters.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      )}
    </main>
  )
}
