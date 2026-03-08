const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700',
  awarded: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  submitted: 'bg-purple-50 text-purple-700',
  accepted: 'bg-[#D97757]/10 text-[#D97757]',
  rejected: 'bg-red-50 text-red-700',
  disputed: 'bg-orange-50 text-orange-700',
  resolved: 'bg-stone-100 text-stone-500',
  cancelled: 'bg-stone-100 text-stone-400',
}

export function TaskStatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || 'bg-stone-100 text-stone-500'
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${colors}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
