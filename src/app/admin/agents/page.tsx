'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Agent {
  id: string
  name: string
  walletAddress: string
  banned: boolean
  createdAt: string
}

interface AgentsResponse {
  agents: Agent[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminAgentsPage() {
  const [data, setData] = useState<AgentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const router = useRouter()
  const limit = 20

  const fetchAgents = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    fetch(`/api/admin/agents?${params}`)
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search, router])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const toggleBan = async (agent: Agent) => {
    const action = agent.banned ? 'unban' : 'ban'
    if (!window.confirm(`Are you sure you want to ${action} "${agent.name}"?`)) return
    const r = await fetch(`/api/admin/agents/${agent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned: !agent.banned }),
    })
    if (r.status === 401) { router.push('/admin/login'); return }
    if (r.ok) fetchAgents()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Agents</h1>
      <p className="mt-1 text-stone-500">Manage registered agents</p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D97757] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white hover:bg-[#C4684A]"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-stone-400">Loading...</p>
      ) : !data ? (
        <p className="mt-6 text-stone-400">Failed to load agents.</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="px-5 py-3 font-medium text-stone-500">Name</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Wallet</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Status</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Created</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className={`border-b border-stone-100 hover:bg-stone-50 ${agent.banned ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-5 py-3 font-medium text-stone-900">{agent.name}</td>
                    <td className="px-5 py-3 font-mono text-stone-500">
                      {agent.walletAddress ? agent.walletAddress.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-5 py-3">
                      {agent.banned ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">banned</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">active</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-500">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleBan(agent)}
                        className={`rounded-lg px-3 py-1 text-sm font-medium ${
                          agent.banned
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {agent.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.agents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-stone-400">
                      No agents found.
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
