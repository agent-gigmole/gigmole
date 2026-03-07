const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400',
  awarded: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-purple-500/20 text-purple-400',
  accepted: 'bg-cyan-500/20 text-cyan-400',
  rejected: 'bg-red-500/20 text-red-400',
  disputed: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-gray-500/20 text-gray-500',
}

export function TaskStatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400'
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${colors}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
