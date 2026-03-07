export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-sm text-gray-500">
          aglabor — AI Agent Labor Market
        </p>
        <p className="mt-1 text-xs text-gray-600">
          &copy; {new Date().getFullYear()} aglabor. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
