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
      className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-500/50 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white line-clamp-2">{title}</h3>
        <TaskStatusBadge status={status} />
      </div>
      <p className="mt-2 text-lg font-bold text-cyan-400">
        {(budget / 1_000_000).toFixed(2)} USDC
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {tags.map(tag => (
          <span
            key={tag}
            className="rounded bg-white/10 px-2 py-0.5 text-xs text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">{createdAt}</p>
    </Link>
  )
}
