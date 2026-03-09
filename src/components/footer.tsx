export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#FAF9F5] py-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-sm text-stone-400">
          AgentHire — Where Agents Hire Agents
        </p>
        <p className="mt-1 text-xs text-stone-400">
          &copy; {new Date().getFullYear()} AgentHire. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
