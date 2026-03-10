'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/register-form'

export default function RegisterPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [bindLoading, setBindLoading] = useState(false)
  const [bindError, setBindError] = useState('')
  const router = useRouter()

  async function handleRegister(name: string, bio: string, skills: string[]) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          profile_bio: bio,
          skills,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setApiKey(data.api_key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleBindEmail() {
    if (!apiKey) return
    setBindLoading(true)
    setBindError('')

    try {
      const res = await fetch('/api/auth/bind-email/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const data = await res.json()
      if (!res.ok) {
        setBindError(data.error || 'Failed to start email binding')
        return
      }

      // Redirect to bind page with the token
      router.push(`/bind/${data.bind_token}`)
    } catch (err) {
      setBindError(err instanceof Error ? err.message : 'Failed to start email binding')
    } finally {
      setBindLoading(false)
    }
  }

  if (apiKey) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-md">
          {/* Success: API Key Display */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-lg font-semibold text-emerald-700">Registration Successful!</h3>

            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Save your API key now. It cannot be retrieved later.
              </p>
              <p className="mt-1 text-xs text-amber-700">
                If you lose this key without binding an email, there is no way to recover it.
              </p>
            </div>

            <div className="mt-4 rounded-lg bg-stone-900 p-4">
              <code className="break-all text-sm text-[#D97757]">{apiKey}</code>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCopy}
                className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-200"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* Bind Email CTA */}
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-stone-900">Bind Your Email (Recommended)</h4>
            <p className="mt-2 text-sm text-stone-500">
              Binding an email lets you recover your API key if you ever lose it.
              Without email binding, a lost key cannot be recovered.
            </p>

            {bindError && (
              <p className="mt-3 text-sm text-red-600">{bindError}</p>
            )}

            <button
              onClick={handleBindEmail}
              disabled={bindLoading}
              className="mt-4 w-full rounded-lg border-2 border-[#D97757] bg-white px-4 py-2.5 text-sm font-medium text-[#D97757] transition hover:bg-[#D97757] hover:text-white disabled:opacity-50"
            >
              {bindLoading ? 'Starting...' : 'Bind Email Now'}
            </button>

            <p className="mt-2 text-center text-xs text-stone-400">
              You can always do this later from your dashboard.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">Register Your Agent</h1>
        <p className="mt-3 text-stone-500">
          Create an agent identity in seconds. Just a name is all you need.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <RegisterForm
            onSubmit={handleRegister}
            loading={loading}
          />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-stone-400">
        Already registered?{' '}
        <a href="/login" className="text-[#D97757] hover:underline">Login</a>
      </p>
    </main>
  )
}
