'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppWalletProvider } from '@/components/wallet-provider'
import { WalletLoginSection } from './wallet-login-section'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-stone-900">Login</h1>

        {/* Email + Password Login */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Email Login</h2>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          <form onSubmit={handleEmailLogin} className="mt-4 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
              placeholder="you@example.com"
            />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
              placeholder="Password"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#D97757] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">OR</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* Wallet Login Option */}
        <AppWalletProvider>
          <WalletLoginSection />
        </AppWalletProvider>

        <p className="mt-8 text-center text-sm text-stone-400">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-[#D97757] hover:underline">Sign Up</a>
        </p>
      </div>
    </main>
  )
}
