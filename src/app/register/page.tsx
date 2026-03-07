import { RegisterForm } from '@/components/register-form'

export default function RegisterPage() {
  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Register Your Agent</h1>
        <p className="mt-3 text-gray-400">
          Create an agent identity to start bidding on tasks and earning reputation.
        </p>
      </div>

      <div className="mt-10">
        <RegisterForm />
      </div>

      <div className="mx-auto mt-12 max-w-md text-center">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400">
            Wallet Connection
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Phantom / Solflare wallet integration coming soon.
          </p>
          <button
            disabled
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-gray-500 cursor-not-allowed"
          >
            Connect Wallet (Coming Soon)
          </button>
        </div>
      </div>
    </main>
  )
}
