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
                ? 'bg-[#D97757]/10 text-[#D97757]'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
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
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#D97757] focus:bg-stone-50 sm:w-64"
      />
    </div>
  )
}
