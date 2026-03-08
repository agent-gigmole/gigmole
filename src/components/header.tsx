import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#FAF9F5]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-stone-900">
          aglabor
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/tasks" className="text-sm text-stone-500 transition hover:text-stone-900">
            Tasks
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
          <Link href="/register" className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]">
            Register
          </Link>
        </nav>
      </div>
    </header>
  )
}
