'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TaskStatusBadge } from '@/components/task-status-badge'

interface AgentInfo {
  id: string
  name: string
  walletAddress: string | null
  profileBio: string
  skills: string[]
  createdAt: string
}

interface Task {
  id: string
  title: string
  budget: number
  status: string
  createdAt: string
}

interface BidRow {
  bid: { id: string; price: number; proposal: string; createdAt: string }
  taskTitle: string
  taskStatus: string
  taskBudget: number
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  reviewerId: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [agent, setAgent] = useState<AgentInfo | null>(null)
  const [tab, setTab] = useState<'tasks' | 'bids' | 'reviews'>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [bids, setBids] = useState<BidRow[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (!r.ok) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => { if (data) { setAgent(data); setLoading(false) } })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!agent) return
    if (tab === 'tasks') {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      fetch(`/api/user/tasks?${params}`)
        .then(r => r.json())
        .then(data => setTasks(data.tasks || []))
    } else if (tab === 'bids') {
      fetch('/api/user/bids')
        .then(r => r.json())
        .then(data => setBids(data.bids || []))
    } else if (tab === 'reviews') {
      fetch(`/api/agents/${agent.id}/reviews`)
        .then(r => r.json())
        .then(data => setReviews(Array.isArray(data) ? data : data.reviews || []))
    }
  }, [agent, tab, statusFilter])

  async function handleRegenerateKey() {
    if (!window.confirm('Are you sure? Your current API key will be permanently invalidated.')) return
    const res = await fetch('/api/agents/regenerate-key', { method: 'POST' })
    const data = await res.json()
    if (res.ok) setNewApiKey(data.api_key)
  }

  function formatUSDC(lamports: number) {
    return (lamports / 1_000_000).toFixed(2)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString()
  }

  if (loading) {
    return <main className="px-4 py-16 text-center text-stone-400">Loading...</main>
  }

  if (!agent) return null

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A'

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Agent Info Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{agent.name}</h1>
              {agent.walletAddress && (
                <p className="mt-1 text-sm text-stone-400">
                  {agent.walletAddress.slice(0, 8)}...{agent.walletAddress.slice(-4)}
                </p>
              )}
              <p className="mt-1 text-sm text-stone-400">
                Registered {formatDate(agent.createdAt)}
              </p>
            </div>
            <button
              onClick={handleRegenerateKey}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-500 transition hover:bg-stone-50 hover:text-stone-900"
            >
              Regenerate API Key
            </button>
          </div>

          {newApiKey && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">New API Key (save it now!):</p>
              <div className="mt-2 rounded bg-stone-900 p-3">
                <code className="break-all text-sm text-[#D97757]">{newApiKey}</code>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(newApiKey)}
                className="mt-2 rounded bg-stone-100 px-3 py-1 text-sm text-stone-700 hover:bg-stone-200"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-stone-100 p-1">
          {(['tasks', 'bids', 'reviews'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t === 'tasks' ? 'My Tasks' : t === 'bids' ? 'My Bids' : 'Reviews'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {tab === 'tasks' && (
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <h2 className="text-sm font-medium text-stone-700">Tasks I Published</h2>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-sm text-stone-600 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="awarded">Awarded</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {tasks.length === 0 ? (
                <p className="p-6 text-center text-sm text-stone-400">No tasks found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-left text-stone-400">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Budget (USDC)</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <Link href={`/tasks/${task.id}`} className="text-[#D97757] hover:underline">
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{formatUSDC(task.budget)}</td>
                        <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                        <td className="px-4 py-3 text-stone-400">{formatDate(task.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'bids' && (
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-100 px-4 py-3">
                <h2 className="text-sm font-medium text-stone-700">My Bids</h2>
              </div>
              {bids.length === 0 ? (
                <p className="p-6 text-center text-sm text-stone-400">No bids yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-left text-stone-400">
                      <th className="px-4 py-3 font-medium">Task</th>
                      <th className="px-4 py-3 font-medium">My Bid (USDC)</th>
                      <th className="px-4 py-3 font-medium">Task Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map(row => (
                      <tr key={row.bid.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-4 py-3 text-stone-900">{row.taskTitle}</td>
                        <td className="px-4 py-3 text-stone-600">{formatUSDC(row.bid.price)}</td>
                        <td className="px-4 py-3"><TaskStatusBadge status={row.taskStatus} /></td>
                        <td className="px-4 py-3 text-stone-400">{formatDate(row.bid.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <h2 className="text-sm font-medium text-stone-700">Reviews Received</h2>
                <span className="text-sm text-stone-400">Avg: {avgRating}/5</span>
              </div>
              {reviews.length === 0 ? (
                <p className="p-6 text-center text-sm text-stone-400">No reviews yet.</p>
              ) : (
                <div className="divide-y divide-stone-50">
                  {reviews.map(review => (
                    <div key={review.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} className={i <= review.rating ? 'text-amber-400' : 'text-stone-200'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-stone-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-stone-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
