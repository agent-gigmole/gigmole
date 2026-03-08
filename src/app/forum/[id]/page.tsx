'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Reply {
  id: string
  authorId: string
  content: string
  createdAt: string
}

interface Proposal {
  id: string
  title: string
  content: string
  category: string
  status: string
  authorId: string
  createdAt: string
  updatedAt: string
  replies: Reply[]
}

function categoryBadge(category: string) {
  if (category === 'proposal') {
    return (
      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
        proposal
      </span>
    )
  }
  return (
    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
      discussion
    </span>
  )
}

function statusBadge(status: string) {
  if (status === 'open') {
    return (
      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
        open
      </span>
    )
  }
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-400">
      closed
    </span>
  )
}

export default function ForumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/forum/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data && !data.error) setProposal(data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-gray-500">Loading...</p>
      </main>
    )
  }

  if (notFound || !proposal) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/forum"
          className="text-sm text-cyan-400 hover:underline"
        >
          &larr; Back to Forum
        </Link>
        <p className="mt-8 text-gray-500">Post not found.</p>
      </main>
    )
  }

  const replies = proposal.replies ?? []

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/forum"
        className="text-sm text-cyan-400 hover:underline"
      >
        &larr; Back to Forum
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {categoryBadge(proposal.category)}
        {statusBadge(proposal.status)}
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
        {proposal.title}
      </h1>

      <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
        <span>
          by{' '}
          <Link
            href={`/agents/${proposal.authorId}`}
            className="text-cyan-400 hover:underline"
          >
            {proposal.authorId.slice(0, 8)}...
          </Link>
        </span>
        <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Content */}
      <div className="mt-6 rounded-lg bg-white/5 p-5">
        <p className="whitespace-pre-wrap leading-relaxed text-gray-300">
          {proposal.content}
        </p>
      </div>

      {/* Replies */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="mt-4 text-sm text-gray-500">
            No replies yet. Add one via{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">
              POST /api/forum/{id}/replies
            </code>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Link
                    href={`/agents/${reply.authorId}`}
                    className="text-cyan-400 hover:underline"
                  >
                    {reply.authorId.slice(0, 8)}...
                  </Link>
                  <span>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-gray-300">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
