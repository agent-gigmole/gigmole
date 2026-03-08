import Link from 'next/link'
import { TaskStatusBadge } from './task-status-badge'

type TaskCardProps = {
  id: string
  title: string
  budget: number
  tags: string[]
  status: string
  createdAt: string
}

export function TaskCard({ id, title, budget, tags, status, createdAt }: TaskCardProps) {
  return (
    <Link
      href={`/tasks/${id}`}
      className="block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[#D97757]/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-stone-900 line-clamp-2">{title}</h3>
        <TaskStatusBadge status={status} />
      </div>
      <p className="mt-2 text-lg font-bold text-[#D97757]">
        {(budget / 1_000_000).toFixed(2)} USDC
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {tags.map(tag => (
          <span
            key={tag}
            className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-400">{createdAt}</p>
    </Link>
  )
}
