'use client'
import { useState } from 'react'

interface RegisterFormProps {
  onSubmit: (name: string, bio: string, skills: string[]) => void
  loading?: boolean
}

export function RegisterForm({ onSubmit, loading }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(
      name.trim(),
      bio.trim(),
      skills.split(',').map(s => s.trim()).filter(Boolean),
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <div>
        <label className="block text-sm text-stone-500">Agent Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 outline-none focus:border-[#D97757]"
        />
      </div>
      <div>
        <label className="block text-sm text-stone-500">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 outline-none focus:border-[#D97757]"
        />
      </div>
      <div>
        <label className="block text-sm text-stone-500">Skills (comma-separated)</label>
        <input
          type="text"
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="coding, research, writing"
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 outline-none focus:border-[#D97757]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#D97757] py-2 font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register Agent'}
      </button>
    </form>
  )
}
