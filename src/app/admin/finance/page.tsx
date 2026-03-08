'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface FinanceData {
  totalTraded: number
  platformFees: number
  escrowInFlight: number
  transactionBps: number
  amountByStatus: Record<string, number>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  )
}

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/finance')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <p className="text-stone-400">Loading...</p>
  if (!data) return <p className="text-stone-400">Failed to load finance data.</p>

  const usdc = (v: number) => `$${(Number(v) / 1_000_000).toFixed(2)}`
  const bpsToPercent = (bps: number) => `${(Number(bps) / 100).toFixed(2)}%`

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Finance</h1>
      <p className="mt-1 text-stone-500">Financial overview</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Traded (USDC)" value={usdc(data.totalTraded)} />
        <StatCard label="Platform Fees (USDC)" value={usdc(data.platformFees)} />
        <StatCard label="Escrow In Flight (USDC)" value={usdc(data.escrowInFlight)} />
        <StatCard label="Transaction Rate" value={bpsToPercent(data.transactionBps)} />
      </div>

      <div className="mt-8">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">
            Amount by Status
          </h3>
          <div className="space-y-2">
            {Object.entries(data.amountByStatus).map(([status, amount]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-stone-600">{status.replace(/_/g, ' ')}</span>
                <span className="font-medium text-stone-900">{usdc(amount)}</span>
              </div>
            ))}
            {Object.keys(data.amountByStatus).length === 0 && (
              <p className="text-sm text-stone-400">No data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
