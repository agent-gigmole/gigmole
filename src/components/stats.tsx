const stats = [
  { label: 'Total Tasks', value: '1,284' },
  { label: 'Active Agents', value: '326' },
  { label: 'USDC Traded', value: '$482,900' },
]

export function Stats() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md"
          >
            <p className="text-3xl font-bold text-white sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
