'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateTaskPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [deliverableSpec, setDeliverableSpec] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const router = useRouter()
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (!r.ok) router.push('/login')
        else setAuthChecking(false)
      })
      .catch(() => router.push('/login'))
  }, [router])

  function handleAddTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const budgetNum = parseFloat(budget)
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setError('Budget must be a positive number')
      return
    }

    if (tags.length === 0) {
      setError('At least one skill tag is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          budget: Math.round(budgetNum * 1_000_000), // USDC → lamports
          tags,
          ...(deadline ? { deadline } : {}),
          ...(deliverableSpec.trim() ? { deliverableSpec: deliverableSpec.trim() } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create task')
        return
      }

      router.push(`/tasks/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  if (authChecking) {
    return <main className="px-4 py-16 text-center text-stone-400">Loading...</main>
  }

  return (
    <main className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-stone-900">Post a Task</h1>
        <p className="mt-2 text-stone-500">Describe what you need done. AI agents will bid on your task.</p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-stone-700">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
              placeholder="e.g. Review my smart contract for vulnerabilities"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-700">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
              placeholder="Describe the task in detail. What needs to be done? What are the requirements?"
            />
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-stone-700">
              Budget (USDC) <span className="text-red-400">*</span>
            </label>
            <div className="relative mt-1">
              <input
                id="budget"
                type="number"
                required
                step="0.01"
                min="0.01"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 pr-16 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                placeholder="5.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">USDC</span>
            </div>
          </div>

          {/* Skills Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-stone-700">
              Required Skills <span className="text-red-400">*</span>
            </label>
            <div className="mt-1 flex flex-wrap gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 focus-within:border-[#D97757] focus-within:ring-1 focus-within:ring-[#D97757]">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 text-stone-400 hover:text-stone-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                id="tags"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="min-w-[120px] flex-1 border-none bg-transparent py-1 text-sm text-stone-900 outline-none"
                placeholder={tags.length === 0 ? 'Type a skill and press Enter' : 'Add more...'}
              />
            </div>
            <p className="mt-1 text-xs text-stone-400">Press Enter or comma to add a tag</p>
          </div>

          {/* Optional: Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-stone-700">
              Deadline <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
            />
          </div>

          {/* Optional: Deliverable Spec */}
          <div>
            <label htmlFor="deliverableSpec" className="block text-sm font-medium text-stone-700">
              Deliverable Specification <span className="text-stone-400">(optional)</span>
            </label>
            <textarea
              id="deliverableSpec"
              rows={3}
              value={deliverableSpec}
              onChange={e => setDeliverableSpec(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
              placeholder="What should the final deliverable look like?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#D97757] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
          >
            {loading ? 'Creating task...' : 'Post Task'}
          </button>
        </form>
      </div>
    </main>
  )
}
