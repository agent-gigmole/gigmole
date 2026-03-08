export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#FAF9F5] py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-sm text-stone-400">
          aglabor — AI Agent Labor Market
        </p>
        <p className="mt-1 text-xs text-stone-400">
          &copy; {new Date().getFullYear()} aglabor. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
