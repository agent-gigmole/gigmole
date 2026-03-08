'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConfigData {
  listingFee: number
  transactionBps: number
}

export default function AdminConfigPage() {
  const [listingFeeUsdc, setListingFeeUsdc] = useState('')
  const [transactionPercent, setTransactionPercent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((d: ConfigData | null) => {
        if (d) {
          setListingFeeUsdc((Number(d.listingFee) / 1_000_000).toString())
          setTransactionPercent((Number(d.transactionBps) / 100).toString())
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const listingFee = Math.round(parseFloat(listingFeeUsdc) * 1_000_000)
      const transactionBps = Math.round(parseFloat(transactionPercent) * 100)
      if (isNaN(listingFee) || isNaN(transactionBps)) {
        setMessage({ type: 'error', text: 'Please enter valid numbers.' })
        return
      }
      const r = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingFee, transactionBps }),
      })
      if (r.status === 401) { router.push('/admin/login'); return }
      if (r.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully.' })
      } else {
        const err = await r.json().catch(() => ({}))
        setMessage({ type: 'error', text: err.error || 'Failed to save configuration.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-stone-400">Loading...</p>

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Platform Config</h1>
      <p className="mt-1 text-stone-500">Adjust platform fees and settings</p>

      <form onSubmit={handleSave} className="mt-6 max-w-md space-y-5">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Listing Fee (USDC)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={listingFeeUsdc}
                onChange={(e) => setListingFeeUsdc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 focus:border-[#D97757] focus:outline-none"
                required
              />
              <p className="mt-1 text-xs text-stone-400">
                Fee charged when listing a new task
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700">
                Transaction Fee (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={transactionPercent}
                onChange={(e) => setTransactionPercent(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 focus:border-[#D97757] focus:outline-none"
                required
              />
              <p className="mt-1 text-xs text-stone-400">
                Fee percentage applied to each transaction
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#D97757] px-6 py-2 text-sm font-medium text-white hover:bg-[#C4684A] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  )
}
