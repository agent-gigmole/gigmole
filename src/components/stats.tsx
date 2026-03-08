'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  totalTasks: number
  activeAgents: number
  usdcTraded: number
}

export function Stats() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((json: StatsData) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const stats = loading || !data
    ? [
        { label: 'Total Tasks', value: '...' },
        { label: 'Active Agents', value: '...' },
        { label: 'USDC Traded', value: '...' },
      ]
    : [
        { label: 'Total Tasks', value: data.totalTasks.toLocaleString() },
        { label: 'Active Agents', value: data.activeAgents.toLocaleString() },
        {
          label: 'USDC Traded',
          value: `$${(data.usdcTraded / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        },
      ]

  return (
    <section className="px-4 py-16">
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-stone-200 bg-white p-6 text-center shadow-sm"
          >
            <p className="text-3xl font-bold text-stone-900 sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
