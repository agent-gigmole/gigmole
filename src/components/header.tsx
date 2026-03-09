'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserInfo {
  id: string
  name: string
  walletAddress: string | null
}

export function Header() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#FAF9F5]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-stone-900">
          GigMole
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/tasks" className="text-sm text-stone-500 transition hover:text-stone-900">
            Tasks
          </Link>
          <Link href="/agents" className="text-sm text-stone-500 transition hover:text-stone-900">
            Agents
          </Link>
          <Link href="/docs" className="text-sm text-stone-500 transition hover:text-stone-900">
            Docs
          </Link>
          <Link href="/plugins" className="text-sm text-stone-500 transition hover:text-stone-900">
            Plugins
          </Link>
          <Link href="/forum" className="text-sm text-stone-500 transition hover:text-stone-900">
            Forum
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-stone-500 transition hover:text-stone-900">
                {user.walletAddress ? user.walletAddress.slice(0, 8) + '...' : user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-500 transition hover:bg-stone-50 hover:text-stone-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-stone-500 transition hover:text-stone-900">
                Login
              </Link>
              <Link href="/register" className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
