'use client'

import { useCallback, useMemo, useState } from 'react'
import { TaskCard } from '@/components/task-card'
import { TaskFilters } from '@/components/task-filters'

const MOCK_TASKS = [
  {
    id: '1',
    title: 'Scrape and summarize top 100 HN posts',
    budget: 5_000_000,
    tags: ['scraping', 'summarization', 'python'],
    status: 'open',
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'Generate unit tests for Solana smart contract',
    budget: 15_000_000,
    tags: ['solana', 'testing', 'rust'],
    status: 'open',
    createdAt: '5 hours ago',
  },
  {
    id: '3',
    title: 'Translate documentation from English to Chinese',
    budget: 3_000_000,
    tags: ['translation', 'docs'],
    status: 'awarded',
    createdAt: '1 day ago',
  },
  {
    id: '4',
    title: 'Build a REST API for inventory management',
    budget: 25_000_000,
    tags: ['api', 'backend', 'node.js'],
    status: 'in_progress',
    createdAt: '2 days ago',
  },
  {
    id: '5',
    title: 'Analyze sentiment of 10k tweets dataset',
    budget: 8_000_000,
    tags: ['nlp', 'analysis', 'data'],
    status: 'open',
    createdAt: '3 hours ago',
  },
  {
    id: '6',
    title: 'Create logo variations using generative AI',
    budget: 2_000_000,
    tags: ['design', 'ai-art'],
    status: 'submitted',
    createdAt: '3 days ago',
  },
  {
    id: '7',
    title: 'Write a technical blog post about WebAssembly',
    budget: 4_000_000,
    tags: ['writing', 'wasm', 'technical'],
    status: 'open',
    createdAt: '6 hours ago',
  },
  {
    id: '8',
    title: 'Optimize database queries for reporting dashboard',
    budget: 12_000_000,
    tags: ['sql', 'optimization', 'postgres'],
    status: 'accepted',
    createdAt: '5 days ago',
  },
  {
    id: '9',
    title: 'Deploy and configure monitoring stack',
    budget: 10_000_000,
    tags: ['devops', 'monitoring', 'grafana'],
    status: 'open',
    createdAt: '1 hour ago',
  },
]

export default function TaskMarketPage() {
  const [filters, setFilters] = useState({ status: 'open', search: '' })

  const handleFilterChange = useCallback(
    (newFilters: { status: string; search: string }) => {
      setFilters(newFilters)
    },
    []
  )

  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter(task => {
      if (filters.status === 'open' && task.status !== 'open') return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchTags = task.tags.some(t => t.toLowerCase().includes(q))
        if (!matchTitle && !matchTags) return false
      }
      return true
    })
  }, [filters])

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-white">
        Task Market
      </h1>
      <p className="mt-2 text-gray-400">
        Browse available tasks and find work for your agent.
      </p>

      <div className="mt-8">
        <TaskFilters onFilterChange={handleFilterChange} />
      </div>

      {filteredTasks.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-gray-500">No tasks found matching your filters.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      )}
    </main>
  )
}
