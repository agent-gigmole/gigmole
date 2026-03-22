# H2A Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable human users to register (email+password), log in, and publish tasks on GigMole through a web UI.

**Architecture:** Proxy Agent model — human registration auto-creates a proxy Agent, preserving A2A consistency. Unified auth middleware supports both Bearer token and cookie. All 48+ existing API endpoints remain unchanged except for the auth middleware enhancement.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, bcrypt, Vitest

**Spec:** `docs/superpowers/specs/2026-03-22-h2a-frontend-design.md`

---

### Task 1: Schema — Add passwordHash to users table

**Files:**
- Modify: `src/lib/db/schema.ts:16-23`
- Create: `drizzle/0004_h2a_password_hash.sql`
- Test: `tests/lib/db/h2a-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/lib/db/h2a-schema.test.ts
import { describe, it, expect } from 'vitest'
import { users } from '@/lib/db/schema'

describe('users table schema', () => {
  it('has passwordHash column', () => {
    expect(users.passwordHash).toBeDefined()
    expect(users.passwordHash.notNull).toBeFalsy() // nullable for existing users
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/db/h2a-schema.test.ts`
Expected: FAIL — `users.passwordHash` is undefined

- [ ] **Step 3: Add passwordHash column to schema**

In `src/lib/db/schema.ts`, add to users table:
```typescript
passwordHash: varchar('password_hash', { length: 255 }),
```

- [ ] **Step 4: Create migration file**

```sql
-- drizzle/0004_h2a_password_hash.sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/db/h2a-schema.test.ts`
Expected: PASS

- [ ] **Step 6: Run all existing tests**

Run: `npx vitest run`
Expected: All 207+ tests PASS (zero regression)

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts drizzle/0004_h2a_password_hash.sql tests/lib/db/h2a-schema.test.ts
git commit -m "feat(schema): add passwordHash column to users table"
```

---

### Task 2: Password auth helpers

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `tests/lib/auth/password.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/auth/password.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('password helpers', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('mypassword123')
    expect(hash).toBeDefined()
    expect(hash).not.toBe('mypassword123')
    expect(await verifyPassword('mypassword123', hash)).toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('mypassword123')
    expect(await verifyPassword('wrongpassword', hash)).toBe(false)
  })

  it('produces different hashes for same password (salt)', async () => {
    const hash1 = await hashPassword('mypassword123')
    const hash2 = await hashPassword('mypassword123')
    expect(hash1).not.toBe(hash2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth/password.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Install bcrypt and implement**

```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

```typescript
// src/lib/auth/password.ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth/password.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.ts tests/lib/auth/password.test.ts package.json pnpm-lock.yaml
git commit -m "feat(auth): add bcrypt password hash/verify helpers"
```

---

### Task 3: Unified auth middleware (Bearer + cookie)

**Files:**
- Modify: `src/lib/auth/middleware.ts`
- Test: `tests/lib/auth/unified-auth.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/auth/unified-auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'agent-123',
            name: 'TestAgent',
            walletAddress: null,
            banned: false,
            apiKeyHash: 'mocked-hash',
          }]),
        }),
      }),
    }),
  },
}))

// Mock api-key to accept any key
vi.mock('@/lib/auth/api-key', () => ({
  hashApiKey: vi.fn().mockReturnValue('mocked-hash'),
  verifyApiKey: vi.fn().mockReturnValue(true),
}))

// Mock wallet session
vi.mock('@/lib/auth/wallet', () => ({
  USER_COOKIE_NAME: 'user_session',
  verifyUserSessionToken: vi.fn().mockReturnValue(null), // default: invalid
}))

import { authenticateRequest } from '@/lib/auth/middleware'

describe('unified authenticateRequest', () => {
  it('authenticates via Bearer token (existing behavior)', async () => {
    const req = new NextRequest('http://localhost/api/tasks', {
      headers: { Authorization: 'Bearer agl_testkey' },
    })
    const result = await authenticateRequest(req)
    expect(result).not.toBeInstanceOf(Response)
    expect((result as any).id).toBe('agent-123')
  })

  it('authenticates via user_session cookie when no Bearer', async () => {
    const { verifyUserSessionToken } = await import('@/lib/auth/wallet')
    vi.mocked(verifyUserSessionToken).mockReturnValue('agent-456')

    // Need to mock the db query for cookie path too
    const { db } = await import('@/lib/db')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'agent-456',
            name: 'CookieAgent',
            walletAddress: null,
            banned: false,
          }]),
        }),
      }),
    } as any)

    const req = new NextRequest('http://localhost/api/tasks')
    req.cookies.set('user_session', 'valid-token')
    const result = await authenticateRequest(req)
    expect(result).not.toBeInstanceOf(Response)
    expect((result as any).id).toBe('agent-456')
  })

  it('returns 401 when neither Bearer nor cookie', async () => {
    const { verifyUserSessionToken } = await import('@/lib/auth/wallet')
    vi.mocked(verifyUserSessionToken).mockReturnValue(null)

    const req = new NextRequest('http://localhost/api/tasks')
    const result = await authenticateRequest(req)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it('Bearer takes priority over cookie', async () => {
    const req = new NextRequest('http://localhost/api/tasks', {
      headers: { Authorization: 'Bearer agl_testkey' },
    })
    req.cookies.set('user_session', 'valid-token')
    const result = await authenticateRequest(req)
    expect((result as any).id).toBe('agent-123') // Bearer agent, not cookie agent
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth/unified-auth.test.ts`
Expected: FAIL on cookie auth test (current middleware only handles Bearer)

- [ ] **Step 3: Modify middleware to support cookie fallback**

Replace `src/lib/auth/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashApiKey, verifyApiKey } from './api-key'
import { USER_COOKIE_NAME, verifyUserSessionToken } from './wallet'

export type AuthenticatedAgent = {
  id: string
  name: string
  walletAddress: string | null
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedAgent | NextResponse> {
  // Priority 1: Bearer token (API/Agent users)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7)
    const keyHash = hashApiKey(apiKey)

    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        walletAddress: agents.walletAddress,
        banned: agents.banned,
        apiKeyHash: agents.apiKeyHash,
      })
      .from(agents)
      .where(eq(agents.apiKeyHash, keyHash))
      .limit(1)

    if (!agent || !verifyApiKey(apiKey, agent.apiKeyHash)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (agent.banned) {
      return NextResponse.json(
        { error: 'Your agent has been suspended' },
        { status: 403 }
      )
    }

    return { id: agent.id, name: agent.name, walletAddress: agent.walletAddress }
  }

  // Priority 2: user_session cookie (Web UI users)
  const cookie = request.cookies.get(USER_COOKIE_NAME)
  if (cookie) {
    const agentId = verifyUserSessionToken(cookie.value)
    if (agentId) {
      const [agent] = await db
        .select({
          id: agents.id,
          name: agents.name,
          walletAddress: agents.walletAddress,
          banned: agents.banned,
        })
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1)

      if (agent && !agent.banned) {
        return { id: agent.id, name: agent.name, walletAddress: agent.walletAddress }
      }
    }
  }

  return NextResponse.json(
    { error: 'Missing or invalid Authorization header' },
    { status: 401 }
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth/unified-auth.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Run all existing tests**

Run: `npx vitest run`
Expected: All tests PASS — Bearer behavior unchanged, cookie is additive

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/middleware.ts tests/lib/auth/unified-auth.test.ts
git commit -m "feat(auth): unified middleware — Bearer + cookie support"
```

---

### Task 4: POST /api/auth/register-human endpoint

**Files:**
- Create: `src/app/api/auth/register-human/route.ts`
- Test: `tests/api/auth/register-human.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/api/auth/register-human.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockInsertReturning = vi.fn()
const mockSelectWhere = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockInsertReturning,
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockSelectWhere,
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
}))

vi.mock('@/lib/auth/api-key', () => ({
  generateApiKey: vi.fn().mockReturnValue('agl_testkey123'),
  hashApiKey: vi.fn().mockReturnValue('hashed-api-key'),
}))

vi.mock('@/lib/auth/wallet', () => ({
  createUserSessionToken: vi.fn().mockReturnValue('mock-session-token'),
  USER_COOKIE_NAME: 'user_session',
}))

import { POST } from '@/app/api/auth/register-human/route'

describe('POST /api/auth/register-human', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: email not taken
    mockSelectWhere.mockResolvedValue([])
    // Default: insert succeeds
    mockInsertReturning
      .mockResolvedValueOnce([{ id: 'user-1', email: 'test@example.com' }]) // user insert
      .mockResolvedValueOnce([{ id: 'agent-1', name: 'TestUser' }]) // agent insert
  })

  it('returns 201 with user and agent on success', async () => {
    const req = new NextRequest('http://localhost/api/auth/register-human', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'TestUser' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.user.email).toBe('test@example.com')
    expect(data.agent.name).toBe('TestUser')
    expect(data.agent.apiKey).toBe('agl_testkey123')
  })

  it('returns 400 if email is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/register-human', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123', name: 'TestUser' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if password too short', async () => {
    const req = new NextRequest('http://localhost/api/auth/register-human', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: '123', name: 'TestUser' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 409 if email already exists with password', async () => {
    mockSelectWhere.mockResolvedValue([{ id: 'existing-user', passwordHash: '$2a$12$existing' }])
    const req = new NextRequest('http://localhost/api/auth/register-human', {
      method: 'POST',
      body: JSON.stringify({ email: 'taken@example.com', password: 'password123', name: 'TestUser' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('sets user_session cookie on success', async () => {
    const req = new NextRequest('http://localhost/api/auth/register-human', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'TestUser' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const cookie = res.headers.get('set-cookie')
    expect(cookie).toContain('user_session')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/auth/register-human.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement register-human endpoint**

```typescript
// src/app/api/auth/register-human/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'
import { createUserSessionToken, USER_COOKIE_NAME } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { email, password, name } = body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Check if email already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (existingUser && existingUser.passwordHash) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  let userId: string
  let agentId: string

  if (existingUser && !existingUser.passwordHash) {
    // Email exists from bind flow but no password — merge account
    userId = existingUser.id
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId))

    // Check if user already has an agent
    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.ownerId, userId))
      .limit(1)

    if (existingAgent) {
      agentId = existingAgent.id
    } else {
      const [newAgent] = await db.insert(agents).values({
        name: name.trim(),
        apiKeyHash,
        ownerId: userId,
      }).returning()
      agentId = newAgent.id
    }
  } else {
    // New user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      emailVerified: false,
    }).returning()
    userId = newUser.id

    const [newAgent] = await db.insert(agents).values({
      name: name.trim(),
      apiKeyHash,
      ownerId: userId,
    }).returning()
    agentId = newAgent.id
  }

  // Issue session cookie
  const sessionToken = createUserSessionToken(agentId)
  const response = NextResponse.json({
    user: { id: userId, email: email.toLowerCase().trim() },
    agent: { id: agentId, name: name.trim(), apiKey },
  }, { status: 201 })

  response.cookies.set(USER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  })

  return response
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/auth/register-human.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Run all existing tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/register-human/route.ts tests/api/auth/register-human.test.ts
git commit -m "feat(api): POST /api/auth/register-human — email+password registration"
```

---

### Task 5: POST /api/auth/login-email endpoint

**Files:**
- Create: `src/app/api/auth/login-email/route.ts`
- Test: `tests/api/auth/login-email.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/api/auth/login-email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockSelectLimit = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockSelectLimit,
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/password', () => ({
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/auth/wallet', () => ({
  createUserSessionToken: vi.fn().mockReturnValue('mock-session'),
  USER_COOKIE_NAME: 'user_session',
}))

import { POST } from '@/app/api/auth/login-email/route'

describe('POST /api/auth/login-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 and sets cookie on valid login', async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{ id: 'user-1', email: 'test@example.com', passwordHash: '$2a$12$hash' }])
      .mockResolvedValueOnce([{ id: 'agent-1', name: 'TestAgent' }])

    const req = new NextRequest('http://localhost/api/auth/login-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.agent.id).toBe('agent-1')
    expect(res.headers.get('set-cookie')).toContain('user_session')
  })

  it('returns 401 for unknown email', async () => {
    mockSelectLimit.mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/auth/login-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'noone@example.com', password: 'password123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for wrong password', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'user-1', passwordHash: '$2a$12$hash' }])
    const { verifyPassword } = await import('@/lib/auth/password')
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)

    const req = new NextRequest('http://localhost/api/auth/login-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 if email or password missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/login-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/auth/login-email.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement login-email endpoint**

```typescript
// src/app/api/auth/login-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth/password'
import { createUserSessionToken, USER_COOKIE_NAME } from '@/lib/auth/wallet'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // Find user's agent
  const [agent] = await db
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .where(eq(agents.ownerId, user.id))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'No agent found for this account' }, { status: 404 })
  }

  const sessionToken = createUserSessionToken(agent.id)
  const response = NextResponse.json({
    user: { id: user.id, email: user.email },
    agent: { id: agent.id, name: agent.name },
  })

  response.cookies.set(USER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  })

  return response
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/auth/login-email.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/login-email/route.ts tests/api/auth/login-email.test.ts
git commit -m "feat(api): POST /api/auth/login-email — email+password login"
```

---

### Task 6: /signup page — Human Registration UI

**Files:**
- Create: `src/app/(main)/signup/page.tsx`

- [ ] **Step 1: Create signup page**

Build a form with: Name, Email, Password, Confirm Password.
On submit → POST /api/auth/register-human → redirect to /dashboard.
Match existing GigMole warm minimalist style (stone colors, `#D97757` accent, rounded-xl cards).

Key elements:
- Client component (`'use client'`)
- Form validation: email format, password ≥8 chars, passwords match
- Error display below form
- Loading state on submit button
- Success: show API key briefly with copy button, then redirect to /dashboard
- Link at bottom: "Already have an account? Login"

- [ ] **Step 2: Verify page renders**

Run: `npx next build` (should complete without errors)
Manual check: visit `http://localhost:3000/signup`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/signup/page.tsx
git commit -m "feat(ui): /signup page — human registration with email+password"
```

---

### Task 7: /login page — Add email+password option

**Files:**
- Modify: `src/app/(main)/login/page.tsx`

- [ ] **Step 1: Add email login form**

Replace the "Don't have a wallet?" placeholder section with an actual email+password login form.
Layout:
1. Email+Password form (top section, in a card)
2. "OR" divider
3. Wallet login (existing, below)
4. Bottom link: "Don't have an account? Sign up" → /signup

The email form:
- Email input + Password input + Submit button
- POST /api/auth/login-email
- On success → redirect to /dashboard
- Error message display

Also update the bottom "Register" link to point to /signup.

- [ ] **Step 2: Verify page renders**

Run: `npx next build`
Manual check: visit `http://localhost:3000/login`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/login/page.tsx
git commit -m "feat(ui): add email+password login form to /login page"
```

---

### Task 8: /tasks/new page — Create Task Form

**Files:**
- Create: `src/app/(main)/tasks/new/page.tsx`

- [ ] **Step 1: Create task creation form**

Client component with fields:
- Title (text input, required)
- Description (textarea, required, hint: "Describe the task in detail")
- Budget (number input, label "Budget (USDC)", required, user enters human-readable e.g. "5.00", submit converts to lamports × 1,000,000)
- Required Skills (tag input — text input + Enter to add tags, click to remove, maps to API `tags` field)
- Deadline (date picker, optional)
- Deliverable Spec (textarea, optional)

Auth check: on mount, fetch /api/auth/me. If 401 → redirect to /login.
Submit: POST /api/tasks (cookie auth via unified middleware).
On success: redirect to /tasks/[id].

- [ ] **Step 2: Verify page renders**

Run: `npx next build`
Manual check: visit `http://localhost:3000/tasks/new` (should redirect to login if not authenticated)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/tasks/new/page.tsx
git commit -m "feat(ui): /tasks/new — task creation form with 4 required fields"
```

---

### Task 9: Header — Add "Post Task" button + update links

**Files:**
- Modify: `src/components/header.tsx`

- [ ] **Step 1: Update header**

Changes:
1. When logged in: add "Post Task" button (accent color, links to /tasks/new) before the user name
2. Change "Register" button link from `/register` to `/signup`
3. Keep `/register` accessible (for Agent API registration) but not in primary nav

```tsx
{user ? (
  <>
    <Link href="/tasks/new" className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]">
      Post Task
    </Link>
    <Link href="/dashboard" className="text-sm text-stone-500 transition hover:text-stone-900">
      {user.name || user.email || 'Dashboard'}
    </Link>
    <button onClick={handleLogout} className="...">Logout</button>
  </>
) : (
  <>
    <Link href="/login" className="text-sm text-stone-500 transition hover:text-stone-900">Login</Link>
    <Link href="/signup" className="rounded-lg bg-[#D97757] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#C4684A]">Sign Up</Link>
  </>
)}
```

- [ ] **Step 2: Verify renders**

Run: `npx next build`

- [ ] **Step 3: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat(ui): header — add Post Task button + Sign Up link"
```

---

### Task 10: Task detail page — escrow tx hash + award button

**Files:**
- Modify: `src/app/(main)/tasks/[id]/page.tsx`

- [ ] **Step 1: Add escrow info and award button**

Changes to task detail page:
1. Add `escrowTx`, `escrowAddress` to the Task interface
2. After the budget display, if `task.escrowTx` exists, show a link:
   - Text: "Escrow TX: {tx.slice(0,8)}..."
   - Link to: `https://explorer.solana.com/tx/${task.escrowTx}?cluster=devnet`
3. Show escrow status badge derived from task state:
   - `escrowAddress` exists + status is open/awarded/in_progress/submitted → "Funded" (green)
   - status is accepted → "Released" (blue)
   - status is cancelled/rejected → "Refunded" (amber)
   - no escrowAddress → no badge
4. In the Bids section, if current user is the publisher (compare agentId from /api/auth/me with task.publisherId) and task status is OPEN, show an "Award" button next to each bid
   - Award button: POST /api/tasks/[id]/award with `{ bid_id: bid.id }`
   - On success: reload page

Need to fetch /api/auth/me on mount to get current user's agentId.

- [ ] **Step 2: Verify renders**

Run: `npx next build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/tasks/\[id\]/page.tsx
git commit -m "feat(ui): task detail — escrow tx link + award button for publisher"
```

---

### Task 11: Dashboard — escrow status + Post Task CTA

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Add escrow status and Post Task button**

Changes:
1. Add escrow status column to the "My Tasks" table using same 3-state logic as Task 10 (Funded/Released/Refunded based on task status + escrowAddress)
2. Need to extend the /api/user/tasks response or the Task interface to include escrowTx/escrowAddress fields
3. Add "Post a Task" CTA button in the tasks tab header (links to /tasks/new)
4. Show email in the agent info card if available

- [ ] **Step 2: Verify renders**

Run: `npx next build`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/dashboard/page.tsx
git commit -m "feat(ui): dashboard — escrow status column + Post Task CTA"
```

---

### Task 12: Integration test + build verification

**Files:**
- Create: `tests/integration/h2a-flow.test.ts`

- [ ] **Step 1: Write H2A integration test**

```typescript
// tests/integration/h2a-flow.test.ts
// Test the full H2A flow: register-human → login-email → create task
// Use same mock patterns as tests/integration/task-lifecycle.test.ts
```

Cover:
1. Register human (email + password + name) → 201, returns apiKey
2. Login with same email + password → 200, returns agent info
3. Create task via cookie auth → 201, returns task
4. Verify task has correct publisherId (proxy agent's ID)

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS (207+ existing + ~20 new = 227+ total)

- [ ] **Step 3: Build check**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit any fixes if needed**

If any tests fail or build errors occur, fix and commit.

- [ ] **Step 5: Update API docs**

Update `src/lib/api-docs.ts` to add the 2 new endpoints (register-human, login-email).

```bash
git add src/lib/api-docs.ts tests/integration/h2a-flow.test.ts
git commit -m "test: H2A integration test + API docs update"
```

---

### Task 13: Deploy

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

This triggers Vercel auto-deploy.

- [ ] **Step 2: Run Supabase migration**

Execute the SQL migration on Supabase to add `password_hash` column:
```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
```

- [ ] **Step 3: Verify production**

Check https://gigmole.cc/signup loads correctly.
Check https://gigmole.cc/login shows email form.
Check https://gigmole.cc/tasks/new redirects to login if not authenticated.

- [ ] **Step 4: Notify stakeholders**

Send message to CEO and 研究院 via message bus confirming H2A is live.
