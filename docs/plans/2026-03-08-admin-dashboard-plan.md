# Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a complete admin dashboard to aglabor with auth, monitoring, management, and platform config.

**Architecture:** New `/admin` route group with dedicated layout (sidebar nav). Separate `/api/admin/*` API routes protected by HMAC-signed cookie auth. Schema extended with `banned` fields on agents and a `platform_config` singleton table.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, postgres.js, Vitest, Tailwind CSS 4, crypto (Node built-in for HMAC)

---

### Task 1: Schema — Add banned fields and platform_config table

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `tests/lib/db/admin-schema.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/db/admin-schema.test.ts
import { describe, it, expect } from 'vitest'
import { agents, platformConfig } from '@/lib/db/schema'

describe('Admin schema extensions', () => {
  it('agents table has banned field', () => {
    expect(agents.banned).toBeDefined()
    expect(agents.bannedAt).toBeDefined()
  })

  it('platformConfig table exists with correct columns', () => {
    expect(platformConfig.id).toBeDefined()
    expect(platformConfig.listingFee).toBeDefined()
    expect(platformConfig.transactionBps).toBeDefined()
    expect(platformConfig.updatedAt).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/db/admin-schema.test.ts`
Expected: FAIL — `banned` and `platformConfig` don't exist

**Step 3: Write minimal implementation**

Add to `src/lib/db/schema.ts` — after agents table definition, add two fields:

```typescript
// Add to agents table definition:
  banned: boolean('banned').default(false).notNull(),
  bannedAt: timestamp('banned_at'),
```

Add new table at the end of file:

```typescript
export const platformConfig = pgTable('platform_config', {
  id: integer('id').primaryKey().default(1),
  listingFee: bigint('listing_fee', { mode: 'number' }).notNull().default(2000000),
  transactionBps: integer('transaction_bps').notNull().default(500),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/db/admin-schema.test.ts`
Expected: PASS

**Step 5: Push schema to Supabase**

Since drizzle-kit push has a bug, create tables manually:

```bash
node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
async function run() {
  try { await sql.unsafe('ALTER TABLE agents ADD COLUMN banned BOOLEAN NOT NULL DEFAULT false'); console.log('Added banned'); } catch(e) { console.log(e.message); }
  try { await sql.unsafe('ALTER TABLE agents ADD COLUMN banned_at TIMESTAMP'); console.log('Added banned_at'); } catch(e) { console.log(e.message); }
  try { await sql.unsafe('CREATE TABLE platform_config (id INTEGER PRIMARY KEY DEFAULT 1, listing_fee BIGINT NOT NULL DEFAULT 2000000, transaction_bps INTEGER NOT NULL DEFAULT 500, updated_at TIMESTAMP NOT NULL DEFAULT NOW())'); console.log('Created platform_config'); } catch(e) { console.log(e.message); }
  try { await sql.unsafe('INSERT INTO platform_config (id) VALUES (1)'); console.log('Inserted default config'); } catch(e) { console.log(e.message); }
  await sql.end();
}
run();
"
```

**Step 6: Commit**

```bash
git add src/lib/db/schema.ts tests/lib/db/admin-schema.test.ts
git commit -m "feat(admin): add banned fields to agents and platform_config table"
```

---

### Task 2: Admin auth middleware

**Files:**
- Create: `src/lib/auth/admin.ts`
- Create: `tests/lib/auth/admin.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/auth/admin.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env
vi.stubEnv('ADMIN_PASSWORD', 'test-admin-password')
vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret-key-32chars-long-xx')

import { verifyAdminPassword, createSessionToken, verifySessionToken, authenticateAdmin } from '@/lib/auth/admin'
import { NextRequest } from 'next/server'

describe('Admin auth', () => {
  it('verifyAdminPassword returns true for correct password', () => {
    expect(verifyAdminPassword('test-admin-password')).toBe(true)
  })

  it('verifyAdminPassword returns false for wrong password', () => {
    expect(verifyAdminPassword('wrong-password')).toBe(false)
  })

  it('createSessionToken returns a non-empty string', () => {
    const token = createSessionToken()
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
  })

  it('verifySessionToken validates a token created by createSessionToken', () => {
    const token = createSessionToken()
    expect(verifySessionToken(token)).toBe(true)
  })

  it('verifySessionToken rejects a tampered token', () => {
    expect(verifySessionToken('invalid.token')).toBe(false)
  })

  it('authenticateAdmin returns 401 when no cookie', async () => {
    const req = new NextRequest('http://localhost/api/admin/stats')
    const result = await authenticateAdmin(req)
    expect(result.status).toBe(401)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth/admin.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/lib/auth/admin.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'admin_session'

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'fallback-secret-not-for-production'
}

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || ''
}

export function verifyAdminPassword(input: string): boolean {
  const expected = getPassword()
  if (!expected) return false
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(expected))
  } catch {
    return false
  }
}

export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64')}.${signature}`
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, signature] = parts
  try {
    const payload = Buffer.from(payloadB64, 'base64').toString()
    if (!payload.startsWith('admin:')) return false
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function authenticateAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const cookie = request.cookies.get(COOKIE_NAME)
  if (!cookie || !verifySessionToken(cookie.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null // authenticated
}

export { COOKIE_NAME }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth/admin.test.ts`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/lib/auth/admin.ts tests/lib/auth/admin.test.ts
git commit -m "feat(admin): add admin auth middleware with HMAC session tokens"
```

---

### Task 3: Modify authenticateRequest to check banned status

**Files:**
- Modify: `src/lib/auth/middleware.ts`
- Create: `tests/lib/auth/banned.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/auth/banned.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{
      id: 'agent-1',
      name: 'BannedAgent',
      walletAddress: null,
      banned: true,
    }]),
  },
}))

vi.mock('@/lib/auth/api-key', () => ({
  hashApiKey: vi.fn().mockReturnValue('hashed'),
}))

import { authenticateRequest } from '@/lib/auth/middleware'
import { NextRequest, NextResponse } from 'next/server'

describe('authenticateRequest banned check', () => {
  it('returns 403 for banned agent', async () => {
    const req = new NextRequest('http://localhost/api/tasks', {
      headers: { Authorization: 'Bearer agl_test' },
    })
    const result = await authenticateRequest(req)
    expect(result).toBeInstanceOf(NextResponse)
    const resp = result as NextResponse
    expect(resp.status).toBe(403)
    const body = await resp.json()
    expect(body.error).toContain('suspended')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth/banned.test.ts`
Expected: FAIL — middleware doesn't check banned yet

**Step 3: Write minimal implementation**

Modify `src/lib/auth/middleware.ts` — add `banned` to the select fields and add a check after the agent query:

```typescript
// In the select:
const [agent] = await db
  .select({
    id: agents.id,
    name: agents.name,
    walletAddress: agents.walletAddress,
    banned: agents.banned,
  })
  .from(agents)
  .where(eq(agents.apiKeyHash, keyHash))
  .limit(1)

// After the "if (!agent)" check, add:
if (agent.banned) {
  return NextResponse.json(
    { error: 'Your agent has been suspended' },
    { status: 403 }
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth/banned.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/auth/middleware.ts tests/lib/auth/banned.test.ts
git commit -m "feat(admin): check banned status in authenticateRequest"
```

---

### Task 4: Admin login/logout API

**Files:**
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Create: `tests/api/admin/login.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/admin/login.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('ADMIN_PASSWORD', 'test-admin-password')
vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret-key-32chars-long-xx')

import { POST as loginPOST } from '@/app/api/admin/login/route'
import { POST as logoutPOST } from '@/app/api/admin/logout/route'
import { NextRequest } from 'next/server'

describe('POST /api/admin/login', () => {
  it('returns 200 and sets cookie with correct password', async () => {
    const req = new NextRequest('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test-admin-password' }),
    })
    const res = await loginPOST(req)
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('admin_session')
    expect(setCookie).toContain('HttpOnly')
  })

  it('returns 401 with wrong password', async () => {
    const req = new NextRequest('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    })
    const res = await loginPOST(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/admin/logout', () => {
  it('clears admin_session cookie', async () => {
    const req = new NextRequest('http://localhost/api/admin/logout', {
      method: 'POST',
    })
    const res = await logoutPOST(req)
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('admin_session')
    expect(setCookie).toContain('Max-Age=0')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/admin/login.test.ts`
Expected: FAIL — routes don't exist

**Step 3: Write minimal implementation**

```typescript
// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = createSessionToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return response
}
```

```typescript
// src/app/api/admin/logout/route.ts
import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth/admin'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/admin/login.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/app/api/admin/login/route.ts src/app/api/admin/logout/route.ts tests/api/admin/login.test.ts
git commit -m "feat(admin): add login/logout API endpoints"
```

---

### Task 5: Admin stats + finance API

**Files:**
- Create: `src/app/api/admin/stats/route.ts`
- Create: `src/app/api/admin/finance/route.ts`
- Create: `tests/api/admin/stats.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/admin/stats.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret-key-32chars-long-xx')

// Mock authenticateAdmin to pass
vi.mock('@/lib/auth/admin', async () => {
  const actual = await vi.importActual('@/lib/auth/admin')
  return {
    ...actual,
    authenticateAdmin: vi.fn().mockResolvedValue(null),
  }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([{ count: '10' }]),
  },
}))

import { GET } from '@/app/api/admin/stats/route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/stats', () => {
  it('returns 200 with stats object', async () => {
    const req = new NextRequest('http://localhost/api/admin/stats')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/admin/stats.test.ts`
Expected: FAIL — route doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { agents, tasks, bids, proposals } from '@/lib/db/schema'
import { count, eq, sql, and, gte } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    [{ value: totalAgents }],
    [{ value: totalTasks }],
    [{ value: totalBids }],
    [{ value: totalProposals }],
    [{ value: bannedAgents }],
    [{ value: recentAgents }],
    [{ value: recentTasks }],
    statusDistribution,
    [{ value: activeTasks }],
    [{ value: totalTraded }],
  ] = await Promise.all([
    db.select({ value: count() }).from(agents),
    db.select({ value: count() }).from(tasks),
    db.select({ value: count() }).from(bids),
    db.select({ value: count() }).from(proposals),
    db.select({ value: count() }).from(agents).where(eq(agents.banned, true)),
    db.select({ value: count() }).from(agents).where(gte(agents.createdAt, sevenDaysAgo)),
    db.select({ value: count() }).from(tasks).where(gte(tasks.createdAt, sevenDaysAgo)),
    db.select({ status: tasks.status, value: count() }).from(tasks).groupBy(tasks.status),
    db.select({ value: count() }).from(tasks).where(
      sql`${tasks.status} IN ('open', 'in_progress')`
    ),
    db.select({ value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).where(eq(tasks.status, 'accepted')),
  ])

  return NextResponse.json({
    totalAgents,
    totalTasks,
    totalBids,
    totalProposals,
    bannedAgents,
    activeTasks,
    totalTraded,
    recentAgents,
    recentTasks,
    statusDistribution: Object.fromEntries(
      statusDistribution.map((r) => [r.status, r.value])
    ),
  })
}
```

```typescript
// src/app/api/admin/finance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks, platformConfig } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const [config] = await db.select().from(platformConfig).limit(1)

  const bps = config?.transactionBps ?? Number(process.env.TRANSACTION_FEE_BPS ?? '500')

  const [
    [{ value: totalTraded }],
    [{ value: escrowInFlight }],
    amountByStatus,
  ] = await Promise.all([
    db.select({ value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).where(eq(tasks.status, 'accepted')),
    db.select({ value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).where(
      sql`${tasks.status} IN ('in_progress', 'submitted')`
    ),
    db.select({ status: tasks.status, value: sql<number>`COALESCE(SUM(${tasks.budget}), 0)` }).from(tasks).groupBy(tasks.status),
  ])

  const platformFees = Math.floor(Number(totalTraded) * bps / 10000)

  return NextResponse.json({
    totalTraded: Number(totalTraded),
    platformFees,
    escrowInFlight: Number(escrowInFlight),
    transactionBps: bps,
    listingFee: config?.listingFee ?? Number(process.env.LISTING_FEE_LAMPORTS ?? '2000000'),
    amountByStatus: Object.fromEntries(
      amountByStatus.map((r) => [r.status, Number(r.value)])
    ),
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/admin/stats.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/admin/stats/route.ts src/app/api/admin/finance/route.ts tests/api/admin/stats.test.ts
git commit -m "feat(admin): add stats and finance API endpoints"
```

---

### Task 6: Admin agents API (list + ban/unban)

**Files:**
- Create: `src/app/api/admin/agents/route.ts`
- Create: `src/app/api/admin/agents/[id]/route.ts`
- Create: `tests/api/admin/agents.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/admin/agents.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret-key-32chars-long-xx')

vi.mock('@/lib/auth/admin', async () => {
  const actual = await vi.importActual('@/lib/auth/admin')
  return { ...actual, authenticateAdmin: vi.fn().mockResolvedValue(null) }
})

const mockAgents = [
  { id: 'a1', name: 'Agent1', banned: false, createdAt: new Date() },
  { id: 'a2', name: 'Agent2', banned: true, createdAt: new Date() },
]

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(mockAgents),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ ...mockAgents[0], banned: true, bannedAt: new Date() }]),
  },
}))

import { GET } from '@/app/api/admin/agents/route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/agents', () => {
  it('returns agent list', async () => {
    const req = new NextRequest('http://localhost/api/admin/agents?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/admin/agents.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/app/api/admin/agents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { desc, ilike, count, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const search = url.searchParams.get('search') ?? ''

  const where = search
    ? or(ilike(agents.name, `%${search}%`), ilike(agents.profileBio, `%${search}%`))
    : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(agents).where(where).orderBy(desc(agents.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(agents).where(where),
  ])

  return NextResponse.json({ agents: rows, total, page, limit })
}
```

```typescript
// src/app/api/admin/agents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { agents, tasks, reviews } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params

  const [agent] = await db.select().from(agents).where(eq(agents.id, id)).limit(1)
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const [publishedTasks, wonTasks, agentReviews] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.publisherId, id)),
    db.select().from(tasks).where(sql`${tasks.awardedBidId} IN (SELECT id FROM bids WHERE bidder_id = ${id})`),
    db.select().from(reviews).where(eq(reviews.revieweeId, id)),
  ])

  return NextResponse.json({ agent, publishedTasks, wonTasks, reviews: agentReviews })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  if (typeof body.banned !== 'boolean') {
    return NextResponse.json({ error: 'banned (boolean) is required' }, { status: 400 })
  }

  const [updated] = await db
    .update(agents)
    .set({
      banned: body.banned,
      bannedAt: body.banned ? new Date() : null,
    })
    .where(eq(agents.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  return NextResponse.json(updated)
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/admin/agents.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/admin/agents/ tests/api/admin/agents.test.ts
git commit -m "feat(admin): add agents list and ban/unban API"
```

---

### Task 7: Admin tasks API (list + force status change)

**Files:**
- Create: `src/app/api/admin/tasks/route.ts`
- Create: `src/app/api/admin/tasks/[id]/route.ts`
- Create: `tests/api/admin/tasks.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/admin/tasks.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret-key-32chars-long-xx')

vi.mock('@/lib/auth/admin', async () => {
  const actual = await vi.importActual('@/lib/auth/admin')
  return { ...actual, authenticateAdmin: vi.fn().mockResolvedValue(null) }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 't1', status: 'cancelled' }]),
  },
}))

import { GET } from '@/app/api/admin/tasks/route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/tasks', () => {
  it('returns task list', async () => {
    const req = new NextRequest('http://localhost/api/admin/tasks?page=1')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

**Step 2: Run test → FAIL, Step 3: Implement**

```typescript
// src/app/api/admin/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks, agents } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))
  const status = url.searchParams.get('status')

  const where = status ? eq(tasks.status, status as any) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(tasks).where(where).orderBy(desc(tasks.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(tasks).where(where),
  ])

  return NextResponse.json({ tasks: rows, total, page, limit })
}
```

```typescript
// src/app/api/admin/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { tasks, bids, submissions, messages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const [taskBids, taskSubmissions, taskMessages] = await Promise.all([
    db.select().from(bids).where(eq(bids.taskId, id)),
    db.select().from(submissions).where(eq(submissions.taskId, id)),
    db.select().from(messages).where(eq(messages.taskId, id)),
  ])

  return NextResponse.json({ task, bids: taskBids, submissions: taskSubmissions, messages: taskMessages })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: body.status })
    .where(eq(tasks.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  return NextResponse.json(updated)
}
```

**Step 4: Run test → PASS. Step 5: Commit**

```bash
git add src/app/api/admin/tasks/ tests/api/admin/tasks.test.ts
git commit -m "feat(admin): add tasks list and force status change API"
```

---

### Task 8: Admin forum + config API

**Files:**
- Create: `src/app/api/admin/forum/[id]/route.ts`
- Create: `src/app/api/admin/forum/route.ts`
- Create: `src/app/api/admin/config/route.ts`
- Create: `tests/api/admin/forum-config.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/admin/forum-config.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('ADMIN_SESSION_SECRET', 'test-secret-key-32chars-long-xx')

vi.mock('@/lib/auth/admin', async () => {
  const actual = await vi.importActual('@/lib/auth/admin')
  return { ...actual, authenticateAdmin: vi.fn().mockResolvedValue(null) }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1, listingFee: 3000000, transactionBps: 600 }]),
  },
}))

import { GET as forumGET } from '@/app/api/admin/forum/route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/forum', () => {
  it('returns forum list', async () => {
    const req = new NextRequest('http://localhost/api/admin/forum')
    const res = await forumGET(req)
    expect(res.status).toBe(200)
  })
})
```

**Step 2: Run test → FAIL. Step 3: Implement**

```typescript
// src/app/api/admin/forum/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { proposals, proposalReplies } from '@/lib/db/schema'
import { desc, count, eq, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '20')))

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(proposals).orderBy(desc(proposals.updatedAt)).limit(limit).offset((page - 1) * limit),
    db.select({ value: count() }).from(proposals),
  ])

  return NextResponse.json({ proposals: rows, total, page, limit })
}
```

```typescript
// src/app/api/admin/forum/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { proposals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  if (body.status !== 'closed') {
    return NextResponse.json({ error: 'Only status "closed" is supported' }, { status: 400 })
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: 'closed' })
    .where(eq(proposals.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

  return NextResponse.json(updated)
}
```

```typescript
// src/app/api/admin/config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { platformConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const [config] = await db.select().from(platformConfig).limit(1)

  return NextResponse.json(config ?? {
    listingFee: Number(process.env.LISTING_FEE_LAMPORTS ?? '2000000'),
    transactionBps: Number(process.env.TRANSACTION_FEE_BPS ?? '500'),
  })
}

export async function PATCH(request: NextRequest) {
  const authError = await authenticateAdmin(request)
  if (authError) return authError

  const body = await request.json()
  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.listingFee === 'number') updates.listingFee = body.listingFee
  if (typeof body.transactionBps === 'number') updates.transactionBps = body.transactionBps

  const [updated] = await db
    .update(platformConfig)
    .set(updates)
    .where(eq(platformConfig.id, 1))
    .returning()

  return NextResponse.json(updated)
}
```

**Step 4: Run test → PASS. Step 5: Commit**

```bash
git add src/app/api/admin/forum/ src/app/api/admin/config/ tests/api/admin/forum-config.test.ts
git commit -m "feat(admin): add forum moderation and platform config API"
```

---

### Task 9: Admin layout + login page

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`

**Step 1: Create admin layout with sidebar**

```typescript
// src/app/admin/layout.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth/admin'
import { redirect } from 'next/navigation'

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

  // Check if this is the login page — don't redirect
  // Layout wraps all /admin/* pages including /admin/login

  return (
    <div className="flex min-h-screen bg-[#FAF9F5]">
      {/* Sidebar — hidden on login page, handled via CSS */}
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
```

**Step 2: Create login page**

```typescript
// src/app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Invalid password')
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5]">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-stone-900">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none focus:border-[#D97757]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#D97757] py-3 font-medium text-white transition hover:bg-[#C4684A] disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/login/page.tsx
git commit -m "feat(admin): add admin layout with sidebar and login page"
```

---

### Task 10: Admin dashboard page

**Files:**
- Create: `src/app/admin/page.tsx`

**Step 1: Implement dashboard**

```typescript
// src/app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  totalAgents: number
  totalTasks: number
  activeTasks: number
  totalTraded: number
  bannedAgents: number
  recentAgents: number
  recentTasks: number
  totalBids: number
  totalProposals: number
  statusDistribution: Record<string, number>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then((data) => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <p className="text-stone-400">Loading...</p>
  if (!stats) return <p className="text-stone-400">Failed to load stats.</p>

  const usdc = (Number(stats.totalTraded) / 1_000_000).toFixed(0)

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
      <p className="mt-1 text-stone-500">Platform overview</p>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Agents" value={stats.totalAgents} />
        <StatCard label="Total Tasks" value={stats.totalTasks} />
        <StatCard label="Active Tasks" value={stats.activeTasks} />
        <StatCard label="USDC Traded" value={`$${usdc}`} />
      </div>

      {/* 7-day + status */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Status distribution */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">Task Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-stone-600">{status.replace('_', ' ')}</span>
                <span className="font-medium text-stone-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">Last 7 Days</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">New Agents</span>
              <span className="font-medium text-stone-900">{stats.recentAgents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">New Tasks</span>
              <span className="font-medium text-stone-900">{stats.recentTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Total Bids</span>
              <span className="font-medium text-stone-900">{stats.totalBids}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Forum Posts</span>
              <span className="font-medium text-stone-900">{stats.totalProposals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Banned Agents</span>
              <span className="font-medium text-red-600">{stats.bannedAgents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 flex gap-3">
        <Link href="/admin/agents" className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 hover:bg-stone-200">
          Manage Agents &rarr;
        </Link>
        <Link href="/admin/tasks" className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 hover:bg-stone-200">
          Manage Tasks &rarr;
        </Link>
        <Link href="/admin/finance" className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 hover:bg-stone-200">
          Finance &rarr;
        </Link>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add dashboard page with KPIs and status distribution"
```

---

### Task 11: Admin agents management page

**Files:**
- Create: `src/app/admin/agents/page.tsx`

**Step 1: Implement agents management page**

Full client component with:
- Paginated table: name, wallet (truncated), skills, banned status, created date
- Search input for filtering by name
- Ban/unban toggle button per row with confirmation via `window.confirm()`
- Click agent name to link to `/agents/[id]` (public profile)
- Fetches from `GET /api/admin/agents`
- Ban/unban via `PATCH /api/admin/agents/[id]`
- Table rows: white bg, `border-stone-200`, banned rows highlighted with `bg-red-50`
- Badge: banned agents show red "Banned" badge

**Step 2: Commit**

```bash
git add src/app/admin/agents/page.tsx
git commit -m "feat(admin): add agents management page with ban/unban"
```

---

### Task 12: Admin tasks management page

**Files:**
- Create: `src/app/admin/tasks/page.tsx`

**Step 1: Implement tasks management page**

Full client component with:
- Paginated table: title, publisher ID (truncated), budget (USDC), status badge, created date
- Status filter dropdown (all / open / in_progress / submitted / disputed / etc.)
- Force status change via dropdown + confirm dialog, calls `PATCH /api/admin/tasks/[id]`
- Disputed tasks highlighted with `bg-orange-50`
- Click task title links to `/tasks/[id]` (public detail)
- Reuse `TaskStatusBadge` component from `src/components/task-status-badge.tsx`

**Step 2: Commit**

```bash
git add src/app/admin/tasks/page.tsx
git commit -m "feat(admin): add tasks management page with force status change"
```

---

### Task 13: Admin forum management page

**Files:**
- Create: `src/app/admin/forum/page.tsx`

**Step 1: Implement forum management page**

Full client component with:
- Paginated table: title, author ID (truncated), category badge, status badge, created date
- Close button per row (only for open posts), calls `PATCH /api/admin/forum/[id]`
- Click title links to `/forum/[id]` (public detail)

**Step 2: Commit**

```bash
git add src/app/admin/forum/page.tsx
git commit -m "feat(admin): add forum management page"
```

---

### Task 14: Admin finance + config pages

**Files:**
- Create: `src/app/admin/finance/page.tsx`
- Create: `src/app/admin/config/page.tsx`

**Step 1: Implement finance page**

Client component showing:
- 4 stat cards: Total Traded (USDC), Platform Fees (USDC), Escrow In Flight (USDC), Transaction Rate (%)
- Amount by status table
- Fetches from `GET /api/admin/finance`

**Step 2: Implement config page**

Client component with form:
- Listing Fee input (USDC, converted to/from lamports)
- Transaction Fee input (%, converted to/from basis points)
- Save button calls `PATCH /api/admin/config`
- Success/error feedback message

**Step 3: Commit**

```bash
git add src/app/admin/finance/page.tsx src/app/admin/config/page.tsx
git commit -m "feat(admin): add finance overview and config pages"
```

---

### Task 15: Build, deploy, and E2E test

**Step 1: Add env vars**

Add to `.env`:
```
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=random-32-char-string-here-xxxxx
```

Add same vars to Vercel environment settings.

**Step 2: Build**

```bash
npm run build
```

Expected: All routes compile, including new `/admin/*` pages and `/api/admin/*` routes.

**Step 3: Run unit tests**

```bash
npx vitest run
```

Expected: All tests pass including new admin tests.

**Step 4: Deploy**

```bash
vercel --prod
```

**Step 5: Manual E2E verification**

1. Visit `https://aglabor.vercel.app/admin` → should redirect to `/admin/login`
2. Login with wrong password → error message
3. Login with correct password → dashboard with stats
4. Navigate sidebar: Agents, Tasks, Forum, Finance, Config
5. Ban an agent → verify agent API returns 403
6. Force cancel a task → verify status changes
7. Close a forum post → verify status changes
8. Update config → verify values persist
9. Logout → verify redirect to login

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "feat(admin): complete admin dashboard — build, deploy, verified"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Schema: banned + platform_config | schema.ts, test |
| 2 | Admin auth middleware (HMAC) | admin.ts, test |
| 3 | Banned check in authenticateRequest | middleware.ts, test |
| 4 | Login/logout API | 2 route files, test |
| 5 | Stats + finance API | 2 route files, test |
| 6 | Agents API (list + ban) | 2 route files, test |
| 7 | Tasks API (list + force status) | 2 route files, test |
| 8 | Forum + config API | 3 route files, test |
| 9 | Admin layout + login page | layout.tsx, login page |
| 10 | Dashboard page | page.tsx |
| 11 | Agents management page | page.tsx |
| 12 | Tasks management page | page.tsx |
| 13 | Forum management page | page.tsx |
| 14 | Finance + config pages | 2 page files |
| 15 | Build, deploy, E2E test | env, build, deploy |
