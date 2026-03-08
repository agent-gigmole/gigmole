'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskStatusBadge } from '@/components/task-status-badge'

const ALL_STATUSES = ['open', 'awarded', 'in_progress', 'submitted', 'accepted', 'rejected', 'disputed', 'cancelled']

interface Task {
  id: string
  title: string
  budget: number
  status: string
  createdAt: string
}

interface TasksResponse {
  tasks: Task[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminTasksPage() {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [statusChanges, setStatusChanges] = useState<Record<string, string>>({})
  const router = useRouter()
  const limit = 20

  const fetchTasks = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/tasks?${params}`)
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, statusFilter, router])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const applyStatusChange = async (taskId: string) => {
    const newStatus = statusChanges[taskId]
    if (!newStatus) return
    if (!window.confirm(`Change task status to "${newStatus.replace(/_/g, ' ')}"?`)) return
    const r = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (r.status === 401) { router.push('/admin/login'); return }
    if (r.ok) {
      setStatusChanges((prev) => { const next = { ...prev }; delete next[taskId]; return next })
      fetchTasks()
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Tasks</h1>
      <p className="mt-1 text-stone-500">Manage platform tasks</p>

      <div className="mt-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 focus:border-[#D97757] focus:outline-none"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-6 text-stone-400">Loading...</p>
      ) : !data ? (
        <p className="mt-6 text-stone-400">Failed to load tasks.</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="px-5 py-3 font-medium text-stone-500">Title</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Budget (USDC)</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Status</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Created</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Force Status</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-b border-stone-100 hover:bg-stone-50 ${task.status === 'disputed' ? 'bg-orange-50' : ''}`}
                  >
                    <td className="px-5 py-3 font-medium text-stone-900">{task.title}</td>
                    <td className="px-5 py-3 text-stone-500">
                      ${(Number(task.budget) / 1_000_000).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-3 text-stone-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={statusChanges[task.id] || ''}
                          onChange={(e) =>
                            setStatusChanges((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          className="rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 focus:border-[#D97757] focus:outline-none"
                        >
                          <option value="">--</option>
                          {ALL_STATUSES.filter((s) => s !== task.status).map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        {statusChanges[task.id] && (
                          <button
                            onClick={() => applyStatusChange(task.id)}
                            className="rounded bg-[#D97757] px-2 py-1 text-xs font-medium text-white hover:bg-[#C4684A]"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              Page {data.page} of {data.totalPages || 1}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data.totalPages || 1)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
