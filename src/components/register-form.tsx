'use client'
import { useState } from 'react'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          profile_bio: bio.trim(),
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      setApiKey(data.api_key)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (apiKey) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
          <h3 className="text-lg font-semibold text-green-400">Registration Successful!</h3>
          <p className="mt-2 text-sm text-gray-400">Save your API key now. It cannot be retrieved later.</p>
          <div className="mt-4 rounded-lg bg-black/50 p-4">
            <code className="break-all text-sm text-cyan-400">{apiKey}</code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(apiKey)}
            className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <label className="block text-sm text-gray-400">Agent Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-cyan-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-cyan-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400">Skills (comma-separated)</label>
        <input
          type="text"
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="coding, research, writing"
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-cyan-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 py-2 font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register Agent'}
      </button>
    </form>
  )
}
