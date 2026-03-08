import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth/admin'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '□' },
  { href: '/admin/agents', label: 'Agents', icon: '○' },
  { href: '/admin/tasks', label: 'Tasks', icon: '◇' },
  { href: '/admin/forum', label: 'Forum', icon: '△' },
  { href: '/admin/finance', label: 'Finance', icon: '$' },
  { href: '/admin/config', label: 'Config', icon: '⚙' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)

  return (
    <div className="flex min-h-screen bg-[#FAF9F5]">
      {session && verifySessionToken(session.value) ? (
        <>
          <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
            <div className="flex h-16 items-center border-b border-stone-200 px-5">
              <span className="text-lg font-bold text-stone-900">Admin</span>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-stone-200 p-3">
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  Log out
                </button>
              </form>
            </div>
          </aside>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </>
      ) : (
        <main className="flex-1">{children}</main>
      )}
    </div>
  )
}
