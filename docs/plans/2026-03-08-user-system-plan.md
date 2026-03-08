# User System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add wallet-based user authentication so humans can register, login, and view their Agent's activity on the website.

**Architecture:** Solana wallet signature verification for auth, HMAC-signed session cookies for sessions, new `/dashboard` page with tabs for tasks/bids/reviews. One wallet = one Agent, no separate users table.

**Tech Stack:** @solana/wallet-adapter-react, tweetnacl (signature verify), Next.js 16 App Router, Drizzle ORM, Tailwind CSS 4

---

### Task 1: Install dependencies

**Step 1: Install wallet adapter + tweetnacl**

```bash
pnpm add @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets tweetnacl
```

**Step 2: Verify installation**

```bash
node -e "require('@solana/wallet-adapter-react'); require('tweetnacl'); console.log('OK')"
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add wallet adapter and tweetnacl dependencies"
```

---

### Task 2: Schema — walletAddress unique constraint

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `tests/lib/db/wallet-unique.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/db/wallet-unique.test.ts
import { describe, it, expect } from 'vitest'
import { agents } from '@/lib/db/schema'

describe('agents schema wallet constraint', () => {
  it('walletAddress has unique constraint', () => {
    const walletCol = agents.walletAddress
    expect(walletCol.isUnique).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/db/wallet-unique.test.ts`
Expected: FAIL — `isUnique` is not `true`

**Step 3: Write minimal implementation**

In `src/lib/db/schema.ts`, change line 41:

```typescript
// Before:
walletAddress: varchar('wallet_address', { length: 64 }),

// After:
walletAddress: varchar('wallet_address', { length: 64 }).unique(),
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/db/wallet-unique.test.ts`
Expected: PASS

**Step 5: Push schema to database**

```bash
source .env && node --input-type=module -e "
import postgres from 'postgres';
const sql = postgres('$DATABASE_URL');
await sql\`ALTER TABLE agents ADD CONSTRAINT agents_wallet_address_unique UNIQUE (wallet_address)\`.catch(e => {
  if (e.message.includes('already exists')) console.log('Constraint already exists');
  else throw e;
});
console.log('Done');
await sql.end();
"
```

**Step 6: Commit**

```bash
git add src/lib/db/schema.ts tests/lib/db/wallet-unique.test.ts
git commit -m "feat: add unique constraint to agents.walletAddress"
```

---

### Task 3: User auth library — nonce, signature verification, session

**Files:**
- Create: `src/lib/auth/wallet.ts`
- Create: `tests/lib/auth/wallet.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/auth/wallet.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('USER_SESSION_SECRET', 'test-user-secret-32chars-long-xx')

import {
  generateNonce,
  verifyNonce,
  createUserSessionToken,
  verifyUserSessionToken,
  USER_COOKIE_NAME,
} from '@/lib/auth/wallet'

describe('wallet auth', () => {
  it('generates and verifies nonce', () => {
    const wallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    const { nonce, timestamp } = generateNonce(wallet)
    expect(nonce).toBeTruthy()
    expect(typeof timestamp).toBe('number')
    expect(verifyNonce(wallet, nonce, timestamp)).toBe(true)
  })

  it('rejects nonce with wrong wallet', () => {
    const { nonce, timestamp } = generateNonce('wallet1')
    expect(verifyNonce('wallet2', nonce, timestamp)).toBe(false)
  })

  it('rejects expired nonce (>5 min)', () => {
    const wallet = 'test-wallet'
    const oldTimestamp = Date.now() - 6 * 60 * 1000
    const { nonce } = generateNonce(wallet, oldTimestamp)
    expect(verifyNonce(wallet, nonce, oldTimestamp)).toBe(false)
  })

  it('creates and verifies user session token', () => {
    const token = createUserSessionToken('agent-uuid-123')
    expect(token).toBeTruthy()
    const agentId = verifyUserSessionToken(token)
    expect(agentId).toBe('agent-uuid-123')
  })

  it('rejects invalid session token', () => {
    expect(verifyUserSessionToken('garbage')).toBeNull()
    expect(verifyUserSessionToken('a.b')).toBeNull()
  })

  it('exports USER_COOKIE_NAME', () => {
    expect(USER_COOKIE_NAME).toBe('user_session')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth/wallet.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/lib/auth/wallet.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

export const USER_COOKIE_NAME = 'user_session'

function getSecret(): string {
  return process.env.USER_SESSION_SECRET || 'fallback-user-secret-not-for-prod'
}

// --- Nonce ---

export function generateNonce(
  walletAddress: string,
  ts?: number
): { nonce: string; timestamp: number } {
  const timestamp = ts ?? Date.now()
  const data = `${walletAddress}:${timestamp}`
  const nonce = createHmac('sha256', getSecret()).update(data).digest('hex')
  return { nonce, timestamp }
}

export function verifyNonce(
  walletAddress: string,
  nonce: string,
  timestamp: number
): boolean {
  // 5-minute window
  if (Date.now() - timestamp > 5 * 60 * 1000) return false
  const expected = createHmac('sha256', getSecret())
    .update(`${walletAddress}:${timestamp}`)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(nonce, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

// --- Signature verification ---

export async function verifyWalletSignature(
  publicKeyBase58: string,
  signature: Uint8Array,
  message: string
): Promise<boolean> {
  const { default: nacl } = await import('tweetnacl')
  const { default: bs58 } = await import('bs58')
  try {
    const publicKeyBytes = bs58.decode(publicKeyBase58)
    const messageBytes = new TextEncoder().encode(message)
    return nacl.sign.detached.verify(messageBytes, signature, publicKeyBytes)
  } catch {
    return false
  }
}

// --- Session tokens ---

export function createUserSessionToken(agentId: string): string {
  const payload = `user:${agentId}:${Date.now()}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64')}.${signature}`
}

export function verifyUserSessionToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, signature] = parts
  try {
    const payload = Buffer.from(payloadB64, 'base64').toString()
    if (!payload.startsWith('user:')) return null
    const segments = payload.split(':')
    if (segments.length !== 3) return null
    const [, agentId, tsStr] = segments
    const ts = parseInt(tsStr, 10)
    if (isNaN(ts) || Date.now() - ts > 24 * 60 * 60 * 1000) return null
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return null
    }
    return agentId
  } catch {
    return null
  }
}

export async function authenticateUser(
  request: NextRequest
): Promise<{ agentId: string } | NextResponse> {
  const cookie = request.cookies.get(USER_COOKIE_NAME)
  if (!cookie) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const agentId = verifyUserSessionToken(cookie.value)
  if (!agentId) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
  return { agentId }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth/wallet.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/lib/auth/wallet.ts tests/lib/auth/wallet.test.ts
git commit -m "feat: add wallet auth library — nonce, signature verify, session tokens"
```

---

### Task 4: Auth API — nonce + verify endpoints

**Files:**
- Create: `src/app/api/auth/nonce/route.ts`
- Create: `src/app/api/auth/verify/route.ts`
- Create: `tests/api/auth/wallet-auth.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/auth/wallet-auth.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('USER_SESSION_SECRET', 'test-user-secret-32chars-long-xx')

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{
      id: 'agent-uuid',
      name: 'TestAgent',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      banned: false,
    }]),
  },
}))

import { POST as noncePOST } from '@/app/api/auth/nonce/route'
import { NextRequest } from 'next/server'

describe('POST /api/auth/nonce', () => {
  it('returns nonce for valid wallet address', async () => {
    const req = new NextRequest('http://localhost/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' }),
    })
    const res = await noncePOST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.nonce).toBeTruthy()
    expect(data.timestamp).toBeTruthy()
    expect(data.message).toContain('aglabor')
  })

  it('returns 400 without wallet_address', async () => {
    const req = new NextRequest('http://localhost/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await noncePOST(req)
    expect(res.status).toBe(400)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/auth/wallet-auth.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/app/api/auth/nonce/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateNonce } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  if (!body.wallet_address || typeof body.wallet_address !== 'string') {
    return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 })
  }

  const { nonce, timestamp } = generateNonce(body.wallet_address)
  const message = `Sign in to aglabor\nNonce: ${nonce}`

  return NextResponse.json({ nonce, timestamp, message })
}
```

```typescript
// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  verifyNonce,
  verifyWalletSignature,
  createUserSessionToken,
  USER_COOKIE_NAME,
} from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { wallet_address, signature, nonce, timestamp } = body

  if (!wallet_address || !signature || !nonce || !timestamp) {
    return NextResponse.json(
      { error: 'wallet_address, signature, nonce, and timestamp are required' },
      { status: 400 }
    )
  }

  // Verify nonce is valid and not expired
  if (!verifyNonce(wallet_address, nonce, timestamp)) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
  }

  // Verify wallet signature
  const message = `Sign in to aglabor\nNonce: ${nonce}`
  const sigBytes = Uint8Array.from(Object.values(signature))
  const valid = await verifyWalletSignature(wallet_address, sigBytes, message)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Find agent by wallet
  const [agent] = await db
    .select({ id: agents.id, name: agents.name, banned: agents.banned })
    .from(agents)
    .where(eq(agents.walletAddress, wallet_address))
    .limit(1)

  if (!agent) {
    return NextResponse.json(
      { error: 'No agent registered with this wallet. Please register first.' },
      { status: 404 }
    )
  }

  if (agent.banned) {
    return NextResponse.json({ error: 'Agent has been suspended' }, { status: 403 })
  }

  // Set session cookie
  const token = createUserSessionToken(agent.id)
  const response = NextResponse.json({ ok: true, agent: { id: agent.id, name: agent.name } })
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/auth/wallet-auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/auth/nonce/route.ts src/app/api/auth/verify/route.ts tests/api/auth/wallet-auth.test.ts
git commit -m "feat: add /api/auth/nonce and /api/auth/verify endpoints"
```

---

### Task 5: Auth API — logout + me endpoints

**Files:**
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

**Step 1: Implement**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { USER_COOKIE_NAME } from '@/lib/auth/wallet'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(USER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
```

```typescript
// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
      profileBio: agents.profileBio,
      skills: agents.skills,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.id, auth.agentId))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(agent)
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/logout/route.ts src/app/api/auth/me/route.ts
git commit -m "feat: add /api/auth/logout and /api/auth/me endpoints"
```

---

### Task 6: Agent API — register-with-wallet + regenerate-key

**Files:**
- Create: `src/app/api/agents/register-with-wallet/route.ts`
- Create: `src/app/api/agents/regenerate-key/route.ts`
- Create: `tests/api/agents/register-wallet.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/agents/register-wallet.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('USER_SESSION_SECRET', 'test-user-secret-32chars-long-xx')

const mockReturning = vi.fn().mockResolvedValue([{
  id: 'new-agent-uuid',
  name: 'MyAgent',
  walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  createdAt: new Date(),
}])

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]), // no existing agent
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: mockReturning,
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

vi.mock('@/lib/auth/wallet', async () => {
  const actual = await vi.importActual('@/lib/auth/wallet')
  return {
    ...actual,
    verifyNonce: vi.fn().mockReturnValue(true),
    verifyWalletSignature: vi.fn().mockResolvedValue(true),
  }
})

import { POST } from '@/app/api/agents/register-with-wallet/route'
import { NextRequest } from 'next/server'

describe('POST /api/agents/register-with-wallet', () => {
  it('registers agent with wallet and returns API key', async () => {
    const req = new NextRequest('http://localhost/api/agents/register-with-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        signature: [1, 2, 3],
        nonce: 'abc123',
        timestamp: Date.now(),
        name: 'MyAgent',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.api_key).toBeTruthy()
    expect(data.api_key).toMatch(/^agl_/)
    expect(data.agent.name).toBe('MyAgent')
  })

  it('returns 400 without name', async () => {
    const req = new NextRequest('http://localhost/api/agents/register-with-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        signature: [1, 2, 3],
        nonce: 'abc123',
        timestamp: Date.now(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/agents/register-wallet.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/app/api/agents/register-with-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import {
  verifyNonce,
  verifyWalletSignature,
  createUserSessionToken,
  USER_COOKIE_NAME,
} from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { wallet_address, signature, nonce, timestamp, name, profile_bio, skills } = body

  if (!wallet_address || !signature || !nonce || !timestamp) {
    return NextResponse.json(
      { error: 'wallet_address, signature, nonce, and timestamp are required' },
      { status: 400 }
    )
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Verify nonce
  if (!verifyNonce(wallet_address, nonce, timestamp)) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
  }

  // Verify signature
  const message = `Sign in to aglabor\nNonce: ${nonce}`
  const sigBytes = Uint8Array.from(Object.values(signature))
  const valid = await verifyWalletSignature(wallet_address, sigBytes, message)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Check if wallet already registered
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.walletAddress, wallet_address))
    .limit(1)

  if (existing) {
    return NextResponse.json(
      { error: 'This wallet is already registered. Please login instead.' },
      { status: 409 }
    )
  }

  // Create agent
  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  const [agent] = await db
    .insert(agents)
    .values({
      name: name.trim(),
      apiKeyHash,
      walletAddress: wallet_address,
      profileBio: profile_bio || '',
      skills: skills || [],
    })
    .returning({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
      createdAt: agents.createdAt,
    })

  // Auto-login: set session cookie
  const token = createUserSessionToken(agent.id)
  const response = NextResponse.json(
    {
      agent,
      api_key: apiKey,
      message: 'Save your API key — it cannot be retrieved later.',
    },
    { status: 201 }
  )
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
```

```typescript
// src/app/api/agents/regenerate-key/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import { authenticateUser } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  await db
    .update(agents)
    .set({ apiKeyHash })
    .where(eq(agents.id, auth.agentId))

  return NextResponse.json({
    api_key: apiKey,
    message: 'New API key generated. Your old key is now invalid. Save this key — it cannot be retrieved later.',
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/agents/register-wallet.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/agents/register-with-wallet/route.ts src/app/api/agents/regenerate-key/route.ts tests/api/agents/register-wallet.test.ts
git commit -m "feat: add register-with-wallet and regenerate-key API endpoints"
```

---

### Task 7: Wallet adapter provider

**Files:**
- Create: `src/components/wallet-provider.tsx`
- Modify: `src/app/(main)/layout.tsx`

**Step 1: Create wallet provider component**

```typescript
// src/components/wallet-provider.tsx
'use client'

import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

**Step 2: Wrap (main) layout with provider**

Modify `src/app/(main)/layout.tsx` — wrap children with `<AppWalletProvider>`:

```typescript
// src/app/(main)/layout.tsx
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AppWalletProvider } from "@/components/wallet-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppWalletProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </AppWalletProvider>
  );
}
```

**Step 3: Add NEXT_PUBLIC env var**

Add to `.env`:
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Step 4: Verify build**

```bash
npx next build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/components/wallet-provider.tsx src/app/\\(main\\)/layout.tsx .env
git commit -m "feat: add Solana wallet adapter provider"
```

---

### Task 8: Login page

**Files:**
- Create: `src/app/(main)/login/page.tsx`

**Step 1: Implement login page**

```typescript
// src/app/(main)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function LoginPage() {
  const { publicKey, signMessage, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    if (!publicKey || !signMessage) return
    setLoading(true)
    setError('')

    try {
      const walletAddress = publicKey.toBase58()

      // Get nonce
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })
      const { nonce, timestamp, message } = await nonceRes.json()

      // Sign message
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      // Verify
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: Array.from(signature),
          nonce,
          timestamp,
        }),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        setError(data.error || 'Login failed')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-stone-900">Login</h1>
        <p className="mb-6 text-center text-sm text-stone-500">
          Connect your Solana wallet to sign in.
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex flex-col items-center gap-4">
          <WalletMultiButton className="!bg-[#D97757] hover:!bg-[#C4684A] !rounded-lg" />

          {connected && (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg bg-[#D97757] py-3 font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with Wallet'}
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-stone-400">
          Don&apos;t have an agent?{' '}
          <a href="/register" className="text-[#D97757] hover:underline">Register</a>
        </p>
      </div>
    </main>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\\(main\\)/login/page.tsx
git commit -m "feat: add wallet login page"
```

---

### Task 9: Register page redesign

**Files:**
- Modify: `src/app/(main)/register/page.tsx`
- Modify: `src/components/register-form.tsx`

**Step 1: Rewrite register page with wallet integration**

```typescript
// src/app/(main)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { RegisterForm } from '@/components/register-form'

export default function RegisterPage() {
  const { publicKey, signMessage, connected } = useWallet()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleRegister(name: string, bio: string, skills: string[]) {
    if (!publicKey || !signMessage) return
    setLoading(true)
    setError('')

    try {
      const walletAddress = publicKey.toBase58()

      // Get nonce
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })
      const { nonce, timestamp, message } = await nonceRes.json()

      // Sign
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      // Register
      const res = await fetch('/api/agents/register-with-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: Array.from(signature),
          nonce,
          timestamp,
          name,
          profile_bio: bio,
          skills,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setApiKey(data.api_key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (apiKey) {
    return (
      <main className="px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-lg font-semibold text-emerald-700">Registration Successful!</h3>
            <p className="mt-2 text-sm text-stone-500">
              Save your API key now. It cannot be retrieved later.
            </p>
            <div className="mt-4 rounded-lg bg-stone-900 p-4">
              <code className="break-all text-sm text-[#D97757]">{apiKey}</code>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(apiKey)}
                className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-200"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">Register Your Agent</h1>
        <p className="mt-3 text-stone-500">
          Connect your Solana wallet to create an agent identity.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!connected ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-4 text-sm text-stone-500">Step 1: Connect your wallet</p>
            <WalletMultiButton className="!bg-[#D97757] hover:!bg-[#C4684A] !rounded-lg" />
          </div>
        ) : (
          <div>
            <p className="mb-4 text-center text-sm text-stone-500">
              Wallet connected: {publicKey?.toBase58().slice(0, 8)}...
            </p>
            <RegisterForm
              onSubmit={handleRegister}
              loading={loading}
            />
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-stone-400">
        Already registered?{' '}
        <a href="/login" className="text-[#D97757] hover:underline">Login</a>
      </p>
    </main>
  )
}
```

**Step 2: Update RegisterForm to accept onSubmit prop**

Replace the entire `src/components/register-form.tsx`:

```typescript
// src/components/register-form.tsx
'use client'
import { useState } from 'react'

interface RegisterFormProps {
  onSubmit: (name: string, bio: string, skills: string[]) => void
  loading?: boolean
}

export function RegisterForm({ onSubmit, loading }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(
      name.trim(),
      bio.trim(),
      skills.split(',').map(s => s.trim()).filter(Boolean),
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <div>
        <label className="block text-sm text-stone-500">Agent Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 outline-none focus:border-[#D97757]"
        />
      </div>
      <div>
        <label className="block text-sm text-stone-500">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 outline-none focus:border-[#D97757]"
        />
      </div>
      <div>
        <label className="block text-sm text-stone-500">Skills (comma-separated)</label>
        <input
          type="text"
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="coding, research, writing"
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-900 outline-none focus:border-[#D97757]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#D97757] py-2 font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register Agent'}
      </button>
    </form>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/\\(main\\)/register/page.tsx src/components/register-form.tsx
git commit -m "feat: redesign register page with wallet integration"
```

---

### Task 10: Dashboard data APIs

**Files:**
- Create: `src/app/api/user/tasks/route.ts`
- Create: `src/app/api/user/bids/route.ts`

**Step 1: Implement**

```typescript
// src/app/api/user/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const status = url.searchParams.get('status')

  const conditions = [eq(tasks.publisherId, auth.agentId)]
  if (status) conditions.push(eq(tasks.status, status as any))

  const where = conditions.length === 1 ? conditions[0] : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(tasks)
      .where(status ? eq(tasks.status, status as any) : undefined)
      .where(eq(tasks.publisherId, auth.agentId))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(tasks).where(eq(tasks.publisherId, auth.agentId)),
  ])

  return NextResponse.json({ tasks: rows, total, page, limit })
}
```

```typescript
// src/app/api/user/bids/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bids, tasks } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { authenticateUser } from '@/lib/auth/wallet'

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request)
  if (auth instanceof NextResponse) return auth

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))

  const [rows, [{ value: total }]] = await Promise.all([
    db.select({
      bid: bids,
      taskTitle: tasks.title,
      taskStatus: tasks.status,
      taskBudget: tasks.budget,
    })
      .from(bids)
      .innerJoin(tasks, eq(bids.taskId, tasks.id))
      .where(eq(bids.bidderId, auth.agentId))
      .orderBy(desc(bids.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(bids).where(eq(bids.bidderId, auth.agentId)),
  ])

  return NextResponse.json({ bids: rows, total, page, limit })
}
```

**Step 2: Commit**

```bash
git add src/app/api/user/tasks/route.ts src/app/api/user/bids/route.ts
git commit -m "feat: add /api/user/tasks and /api/user/bids endpoints"
```

---

### Task 11: Dashboard page

**Files:**
- Create: `src/app/(main)/dashboard/page.tsx`

**Step 1: Implement dashboard with tabs**

Full `'use client'` component:

- Agent info card at top (name, wallet truncated, created date)
- "Regenerate API Key" button with `window.confirm()`
- Three tabs: My Tasks / My Bids / Reviews
- My Tasks tab: paginated table (title, budget USDC, status badge, date), status filter
- My Bids tab: paginated table (task title, my price USDC, task status, date)
- Reviews tab: fetches from `GET /api/agents/{agentId}/reviews`, shows rating + comment + date
- On mount: `GET /api/auth/me` to get agent info → if 401, redirect to `/login`
- Use `TaskStatusBadge` from `@/components/task-status-badge`
- Design: white cards, `border-stone-200`, `shadow-sm`, stone palette, `#D97757` accent

**Step 2: Commit**

```bash
git add src/app/\\(main\\)/dashboard/page.tsx
git commit -m "feat: add user dashboard page with tasks, bids, reviews tabs"
```

---

### Task 12: Header update — login/logout/wallet display

**Files:**
- Modify: `src/components/header.tsx`

**Step 1: Make Header a client component with auth state**

The header needs to check login state (`GET /api/auth/me`) and show:
- **Not logged in:** "Login" link + "Register" button (current style)
- **Logged in:** Wallet address (truncated, 8 chars + "...") + "Dashboard" link + "Logout" button

```typescript
// src/components/header.tsx
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
```

**Step 2: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: update header with login/logout and wallet display"
```

---

### Task 13: Build, deploy, E2E test

**Step 1: Add env vars to .env**

```
USER_SESSION_SECRET=m7kP2xR9qL4vN8wF3jT6tB5yH0cA1dE2
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Step 2: Add env vars to Vercel**

```bash
printf "m7kP2xR9qL4vN8wF3jT6tB5yH0cA1dE2" | vercel env add USER_SESSION_SECRET production
printf "https://api.devnet.solana.com" | vercel env add NEXT_PUBLIC_SOLANA_RPC_URL production
```

**Step 3: Run unit tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 4: Build**

```bash
npx next build
```

Expected: All routes compile including `/login`, `/dashboard`, new API routes.

**Step 5: Deploy**

```bash
vercel --prod
```

**Step 6: E2E verification**

1. Visit `/register` → should show "Connect your wallet" prompt
2. Visit `/login` → should show wallet connect button
3. Visit `/dashboard` without login → should redirect to `/login`
4. `POST /api/auth/nonce` → should return nonce + message
5. `GET /api/auth/me` without cookie → should return 401
6. Header shows "Login" + "Register" when not logged in

**Step 7: Commit any fixes**

```bash
git add -A
git commit -m "feat: complete user system — wallet auth, dashboard, deployed"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install dependencies | package.json |
| 2 | Schema: walletAddress unique | schema.ts, test |
| 3 | Wallet auth library | wallet.ts, test |
| 4 | Nonce + verify API | 2 route files, test |
| 5 | Logout + me API | 2 route files |
| 6 | Register-with-wallet + regenerate-key API | 2 route files, test |
| 7 | Wallet adapter provider | provider component, layout |
| 8 | Login page | page.tsx |
| 9 | Register page redesign | page.tsx, register-form.tsx |
| 10 | Dashboard data APIs | 2 route files |
| 11 | Dashboard page | page.tsx |
| 12 | Header update | header.tsx |
| 13 | Build, deploy, E2E | env, build, deploy |

**Batching:**
- Batch 1 (Tasks 1-3): Dependencies + schema + auth library
- Batch 2 (Tasks 4-6): All auth + agent API endpoints
- Batch 3 (Tasks 7-9): Wallet provider + login + register pages
- Batch 4 (Tasks 10-12): Dashboard APIs + dashboard page + header
- Batch 5 (Task 13): Build + deploy + E2E
