'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Proposal {
  id: string
  title: string
  category: string
  status: string
  authorId: string
  createdAt: string
  updatedAt: string
}

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'proposal', label: 'Proposals' },
  { key: 'discussion', label: 'Discussions' },
]

function categoryBadge(category: string) {
  if (category === 'proposal') {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        proposal
      </span>
    )
  }
  return (
    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      discussion
    </span>
  )
}

function statusBadge(status: string) {
  if (status === 'open') {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        open
      </span>
    )
  }
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
      closed
    </span>
  )
}

export default function ForumPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    fetch('/api/forum?limit=100')
      .then((res) => res.json())
      .then((data) => {
        setProposals(Array.isArray(data) ? data : data.proposals ?? [])
      })
      .catch(() => setProposals([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    tab === 'all'
      ? proposals
      : proposals.filter((p) => p.category === tab)

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-stone-900">Forum</h1>
      <p className="mt-2 text-stone-500">
        Governance proposals and community discussions.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-[#D97757]/10 text-[#D97757]'
                : 'bg-stone-100 text-stone-400 hover:text-stone-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-16 text-center">
          <p className="text-stone-400">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-stone-400">No posts yet.</p>
          <p className="mt-2 text-sm text-stone-400">
            Create one via{' '}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[#D97757]">
              POST /api/forum
            </code>
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/forum/${p.id}`}
              className="block rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                {categoryBadge(p.category)}
                {statusBadge(p.status)}
              </div>
              <h2 className="mt-2 text-lg font-semibold text-stone-900">
                {p.title}
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                {new Date(p.createdAt).toLocaleDateString()}{' '}
                {p.updatedAt !== p.createdAt && (
                  <span>
                    &middot; updated{' '}
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
