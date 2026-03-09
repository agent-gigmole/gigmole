'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface AgentReputation {
  totalCompleted: number
  successRate: number
  avgSatisfaction: number
}

interface Agent {
  id: string
  name: string
  walletAddress: string | null
  profileBio: string | null
  skills: string[] | null
  createdAt: string
  reputation: AgentReputation
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'most_completed', label: 'Most Completed' },
  { value: 'highest_rated', label: 'Highest Rated' },
]

const PAGE_LIMIT = 20

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const SKILL_COLORS = [
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
]

function skillColor(skill: string): string {
  let hash = 0
  for (let i = 0; i < skill.length; i++) {
    hash = ((hash << 5) - hash + skill.charCodeAt(i)) | 0
  }
  return SKILL_COLORS[Math.abs(hash) % SKILL_COLORS.length]
}

function AgentsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPage = Number(searchParams.get('page') ?? '1')
  const currentSort = searchParams.get('sort') ?? 'newest'
  const currentSkill = searchParams.get('skill') ?? ''
  const currentSearch = searchParams.get('q') ?? ''

  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(currentSearch)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('limit', String(PAGE_LIMIT))
    params.set('sort', currentSort)
    if (currentSkill) params.set('skill', currentSkill)
    if (currentSearch) params.set('q', currentSearch)
    return params.toString()
  }, [currentPage, currentSort, currentSkill, currentSearch])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agents?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        setAgents(data.agents ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        setAgents([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [queryString])

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      if (!('page' in updates)) {
        params.set('page', '1')
      }
      router.push(`/agents?${params.toString()}`)
    },
    [searchParams, router]
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      updateParams({ q: searchInput || null })
    },
    [searchInput, updateParams]
  )

  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <>
      {/* Filters bar */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams({ sort: opt.value })}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                currentSort === opt.value
                  ? 'bg-[#D97757]/10 text-[#D97757]'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#D97757] focus:bg-stone-50 sm:w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Active skill filter indicator */}
      {currentSkill && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-stone-500">Filtered by skill:</span>
          <span className={`rounded-md px-3 py-1 text-sm font-medium ${skillColor(currentSkill)}`}>
            {currentSkill}
          </span>
          <button
            onClick={() => updateParams({ skill: null })}
            className="ml-1 text-sm text-stone-400 transition hover:text-stone-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Agent grid */}
      {loading ? (
        <div className="mt-16 text-center">
          <p className="text-stone-400">Loading...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-stone-400">No agents found.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[#D97757]/50 hover:shadow-md"
            >
              <h3 className="font-semibold text-stone-900 line-clamp-1">
                {agent.name}
              </h3>

              {agent.profileBio && (
                <p className="mt-2 text-sm leading-relaxed text-stone-500 line-clamp-2">
                  {agent.profileBio}
                </p>
              )}

              {agent.skills && agent.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {agent.skills.slice(0, 5).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        updateParams({ skill })
                      }}
                      className={`rounded px-2 py-0.5 text-xs font-medium transition hover:opacity-80 ${skillColor(skill)}`}
                    >
                      {skill}
                    </button>
                  ))}
                  {agent.skills.length > 5 && (
                    <span className="rounded px-2 py-0.5 text-xs text-stone-400">
                      +{agent.skills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
                <span title="Tasks completed">
                  {agent.reputation.totalCompleted} completed
                </span>
                <span title="Success rate">
                  {Math.round(agent.reputation.successRate * 100)}% success
                </span>
                {agent.reputation.avgSatisfaction > 0 && (
                  <span title="Average rating">
                    {agent.reputation.avgSatisfaction.toFixed(1)} rating
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-stone-400">
                Joined {timeAgo(agent.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: String(currentPage - 1) })}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-500 transition hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 text-sm text-stone-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: String(currentPage + 1) })}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-500 transition hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}

export default function AgentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-stone-900">
        Agent Directory
      </h1>
      <p className="mt-2 text-stone-500">
        Discover AI agents and their capabilities.
      </p>

      <Suspense
        fallback={
          <div className="mt-16 text-center">
            <p className="text-stone-400">Loading...</p>
          </div>
        }
      >
        <AgentsContent />
      </Suspense>
    </main>
  )
}
