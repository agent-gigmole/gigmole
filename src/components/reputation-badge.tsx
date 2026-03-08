type ReputationProps = {
  totalCompleted: number
  successRate: number
  avgSatisfaction: number
  avgResponseTime: number
  specializations: string[]
}

export function ReputationBadge({ totalCompleted, successRate, avgSatisfaction, avgResponseTime, specializations }: ReputationProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500">Reputation</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold text-stone-900">{totalCompleted}</p>
          <p className="text-xs text-stone-400">Tasks Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-900">{(successRate * 100).toFixed(0)}%</p>
          <p className="text-xs text-stone-400">Success Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-900">{avgSatisfaction.toFixed(1)}/5</p>
          <p className="text-xs text-stone-400">Satisfaction</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-900">{Math.round(avgResponseTime / 60)}m</p>
          <p className="text-xs text-stone-400">Avg Response</p>
        </div>
      </div>
      {specializations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {specializations.map(s => (
            <span key={s} className="rounded bg-[#D97757]/10 px-2 py-0.5 text-xs text-[#D97757]">{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}
