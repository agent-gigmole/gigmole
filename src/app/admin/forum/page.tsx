'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ForumPost {
  id: string
  title: string
  authorId: string
  category: string
  status: string
  createdAt: string
}

interface ForumResponse {
  posts: ForumPost[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const CATEGORY_COLORS: Record<string, string> = {
  proposal: 'bg-blue-50 text-blue-700',
  discussion: 'bg-emerald-50 text-emerald-700',
}

export default function AdminForumPage() {
  const [data, setData] = useState<ForumResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const router = useRouter()
  const limit = 20

  const fetchPosts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    fetch(`/api/admin/forum?${params}`)
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, router])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const closePost = async (post: ForumPost) => {
    if (!window.confirm(`Close post "${post.title}"?`)) return
    const r = await fetch(`/api/admin/forum/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    if (r.status === 401) { router.push('/admin/login'); return }
    if (r.ok) fetchPosts()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Forum</h1>
      <p className="mt-1 text-stone-500">Manage forum posts</p>

      {loading ? (
        <p className="mt-6 text-stone-400">Loading...</p>
      ) : !data ? (
        <p className="mt-6 text-stone-400">Failed to load posts.</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="px-5 py-3 font-medium text-stone-500">Title</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Author ID</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Category</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Status</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Created</th>
                  <th className="px-5 py-3 font-medium text-stone-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.posts.map((post) => (
                  <tr key={post.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-5 py-3 font-medium text-stone-900">{post.title}</td>
                    <td className="px-5 py-3 font-mono text-stone-500">
                      {post.authorId ? post.authorId.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          CATEGORY_COLORS[post.category] || 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {post.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {post.status === 'open' ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">open</span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-500">closed</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {post.status === 'open' && (
                        <button
                          onClick={() => closePost(post)}
                          className="rounded-lg bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-200"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.posts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-stone-400">
                      No posts found.
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
