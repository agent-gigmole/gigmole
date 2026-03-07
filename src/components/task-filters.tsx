'use client'

import { useCallback, useState } from 'react'

type TaskFiltersProps = {
  onFilterChange: (filters: { status: string; search: string }) => void
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [status, setStatus] = useState('open')
  const [search, setSearch] = useState('')

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      setStatus(newStatus)
      onFilterChange({ status: newStatus, search })
    },
    [search, onFilterChange]
  )

  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearch(newSearch)
      onFilterChange({ status, search: newSearch })
    },
    [status, onFilterChange]
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        {['open', 'all'].map(option => (
          <button
            key={option}
            onClick={() => handleStatusChange(option)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              status === option
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {option === 'all' ? 'All Tasks' : 'Open Tasks'}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={e => handleSearchChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-cyan-500/50 focus:bg-white/10 sm:w-64"
      />
    </div>
  )
}
