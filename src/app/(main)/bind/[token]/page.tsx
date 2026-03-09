'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

type BindStep = 'loading' | 'email' | 'verify' | 'success' | 'error'

export default function BindEmailPage() {
  const params = useParams()
  const token = params.token as string

  const [step, setStep] = useState<BindStep>('loading')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [boundEmail, setBoundEmail] = useState('')

  // Validate token on mount
  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/bind-email/status?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError('Invalid or expired link.')
          setStep('error')
          return
        }

        if (data.status === 'completed') {
          setBoundEmail(data.email || '')
          setStep('success')
        } else if (data.status === 'expired') {
          setError('This link has expired. Please request a new one from your CLI.')
          setStep('error')
        } else {
          setStep('email')
        }
      } catch {
        setError('Failed to verify link.')
        setStep('error')
      }
    }
    checkToken()
  }, [token])

  const handleSendCode = useCallback(async () => {
    if (!email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/bind-email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bind_token: token, email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send code')
        return
      }

      setStep('verify')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, token])

  const handleVerifyCode = useCallback(async () => {
    if (!code) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/bind-email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bind_token: token, code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        if (data.attempts_remaining !== undefined) {
          setError(`Invalid code. ${data.attempts_remaining} attempts remaining.`)
        }
        return
      }

      setBoundEmail(data.email || email)
      setStep('success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [code, token, email])

  const handleResend = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/bind-email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bind_token: token, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to resend')
      } else {
        setError('')
        setCode('')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }, [token, email])

  if (step === 'loading') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-stone-500">Verifying link...</div>
      </main>
    )
  }

  if (step === 'error') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">Link Invalid</h2>
          <p className="mt-2 text-sm text-stone-600">{error}</p>
        </div>
      </main>
    )
  }

  if (step === 'success') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-emerald-700">Email Bound!</h2>
          <p className="mt-2 text-sm text-stone-600">
            {boundEmail && <span className="font-medium">{boundEmail}</span>}
            {boundEmail && <br />}
            Your CLI should detect this automatically.
          </p>
          <p className="mt-3 text-xs text-stone-400">
            You can now recover your API key using this email.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-stone-900">Bind Email to Agent</h1>
          <p className="mt-1 text-sm text-stone-500">
            {step === 'email'
              ? 'Enter your email to receive a verification code.'
              : 'Enter the 6-digit code sent to your email.'}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 'email' && (
            <div className="mt-6">
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-[#D97757] focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              />
              <button
                onClick={handleSendCode}
                disabled={loading || !email}
                className="mt-4 w-full rounded-lg bg-[#D97757] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-stone-500">
                Code sent to <span className="font-medium text-stone-700">{email}</span>
              </p>
              <label htmlFor="code" className="block text-sm font-medium text-stone-700">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-center text-2xl tracking-[0.3em] text-stone-900 placeholder:text-stone-400 focus:border-[#D97757] focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              />
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="mt-4 w-full rounded-lg bg-[#D97757] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={handleResend}
                disabled={loading}
                className="mt-2 w-full text-center text-sm text-[#D97757] hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
