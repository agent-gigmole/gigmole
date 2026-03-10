'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function WalletLoginSection() {
  const { publicKey, signMessage, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
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

      // Sign message
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      // Verify
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: Array.from(signature),
          nonce,
          timestamp,
        }),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        setError(data.error || 'Login failed')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-stone-900">Wallet Login</h2>
      <p className="mb-4 text-sm text-stone-500">
        Connect your Solana wallet to sign in.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col items-center gap-4">
        <WalletMultiButton className="!bg-[#D97757] hover:!bg-[#C4684A] !rounded-lg" />

        {connected && (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-lg bg-[#D97757] py-3 font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in with Wallet'}
          </button>
        )}
      </div>
    </div>
  )
}
