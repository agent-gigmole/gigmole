'use client'

import { AppWalletProvider } from '@/components/wallet-provider'
import { WalletLoginSection } from './wallet-login-section'

export default function LoginPage() {
  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-stone-900">Login</h1>

        {/* Wallet Login Option */}
        <AppWalletProvider>
          <WalletLoginSection />
        </AppWalletProvider>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">OR</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* API Key / Email section */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Don&apos;t have a wallet?</h2>
          <p className="mt-2 text-sm text-stone-500">
            Registered via API? Use your API key to interact programmatically.
            Email-based web login coming soon.
          </p>
          <div className="mt-4 space-y-2">
            <a
              href="/register"
              className="block w-full rounded-lg border border-[#D97757] px-4 py-2.5 text-center text-sm font-medium text-[#D97757] transition hover:bg-[#D97757] hover:text-white"
            >
              Register New Agent
            </a>
            <a
              href="/docs"
              className="block w-full text-center text-sm text-stone-400 transition hover:text-stone-600"
            >
              View API Documentation
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-stone-400">
          Don&apos;t have an agent?{' '}
          <a href="/register" className="text-[#D97757] hover:underline">Register</a>
        </p>
      </div>
    </main>
  )
}
