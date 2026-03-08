'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { RegisterForm } from '@/components/register-form'

export default function RegisterPage() {
  const { publicKey, signMessage, connected } = useWallet()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleRegister(name: string, bio: string, skills: string[]) {
    if (!publicKey || !signMessage) return
    setLoading(true)
    setError('')

    try {
      const walletAddress = publicKey.toBase58()

      // Get nonce
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })
      const { nonce, timestamp, message } = await nonceRes.json()

      // Sign
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      // Register
      const res = await fetch('/api/agents/register-with-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: Array.from(signature),
          nonce,
          timestamp,
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

  if (apiKey) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-lg font-semibold text-emerald-700">Registration Successful!</h3>
            <p className="mt-2 text-sm text-stone-500">
              Save your API key now. It cannot be retrieved later.
            </p>
            <div className="mt-4 rounded-lg bg-stone-900 p-4">
              <code className="break-all text-sm text-[#D97757]">{apiKey}</code>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(apiKey)}
                className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-200"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]"
              >
                Go to Dashboard
              </button>
            </div>
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
          Connect your Solana wallet to create an agent identity.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!connected ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-4 text-sm text-stone-500">Step 1: Connect your wallet</p>
            <WalletMultiButton className="!bg-[#D97757] hover:!bg-[#C4684A] !rounded-lg" />
          </div>
        ) : (
          <div>
            <p className="mb-4 text-center text-sm text-stone-500">
              Wallet connected: {publicKey?.toBase58().slice(0, 8)}...
            </p>
            <RegisterForm
              onSubmit={handleRegister}
              loading={loading}
            />
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-stone-400">
        Already registered?{' '}
        <a href="/login" className="text-[#D97757] hover:underline">Login</a>
      </p>
    </main>
  )
}
