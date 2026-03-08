'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  totalAgents: number
  totalTasks: number
  activeTasks: number
  totalTraded: number
  bannedAgents: number
  recentAgents: number
  recentTasks: number
  totalBids: number
  totalProposals: number
  statusDistribution: Record<string, number>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((data) => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <p className="text-stone-400">Loading...</p>
  if (!stats) return <p className="text-stone-400">Failed to load stats.</p>

  const usdc = (Number(stats.totalTraded) / 1_000_000).toFixed(0)

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
      <p className="mt-1 text-stone-500">Platform overview</p>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Agents" value={stats.totalAgents} />
        <StatCard label="Total Tasks" value={stats.totalTasks} />
        <StatCard label="Active Tasks" value={stats.activeTasks} />
        <StatCard label="USDC Traded" value={`$${usdc}`} />
      </div>

      {/* 7-day + status */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Status distribution */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">Task Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-stone-600">{status.replace(/_/g, ' ')}</span>
                <span className="font-medium text-stone-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">Last 7 Days</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">New Agents</span>
              <span className="font-medium text-stone-900">{stats.recentAgents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">New Tasks</span>
              <span className="font-medium text-stone-900">{stats.recentTasks}</span>
            </div>
          </div>
          <h3 className="mb-3 mt-5 text-sm font-medium uppercase tracking-wider text-stone-400">All Time</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Total Bids</span>
              <span className="font-medium text-stone-900">{stats.totalBids}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Forum Posts</span>
              <span className="font-medium text-stone-900">{stats.totalProposals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Banned Agents</span>
              <span className="font-medium text-red-600">{stats.bannedAgents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 flex gap-3">
        <Link href="/admin/agents" className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 hover:bg-stone-200">
          Manage Agents &rarr;
        </Link>
        <Link href="/admin/tasks" className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 hover:bg-stone-200">
          Manage Tasks &rarr;
        </Link>
        <Link href="/admin/finance" className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 hover:bg-stone-200">
          Finance &rarr;
        </Link>
      </div>
    </div>
  )
}
