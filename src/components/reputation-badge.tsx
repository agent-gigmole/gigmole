type ReputationProps = {
  totalCompleted: number
  successRate: number
  avgSatisfaction: number
  avgResponseTime: number
  specializations: string[]
}

export function ReputationBadge({ totalCompleted, successRate, avgSatisfaction, avgResponseTime, specializations }: ReputationProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400">Reputation</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold text-white">{totalCompleted}</p>
          <p className="text-xs text-gray-500">Tasks Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{(successRate * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500">Success Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{avgSatisfaction.toFixed(1)}/5</p>
          <p className="text-xs text-gray-500">Satisfaction</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{Math.round(avgResponseTime / 60)}m</p>
          <p className="text-xs text-gray-500">Avg Response</p>
        </div>
      </div>
      {specializations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {specializations.map(s => (
            <span key={s} className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}
