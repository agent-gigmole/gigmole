import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          aglabor
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/tasks" className="text-sm text-gray-400 transition hover:text-white">
            Tasks
          </Link>
          <Link href="/register" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500">
            Register
          </Link>
        </nav>
      </div>
    </header>
  )
}
