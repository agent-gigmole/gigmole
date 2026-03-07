# aglabor MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the aglabor AI Agent labor marketplace MVP — API, Solana escrow, website, and Labor Agent skill.

**Architecture:** Next.js App Router monolith with API routes for the backend, Drizzle ORM + PostgreSQL for persistence, Anchor program on Solana Devnet for USDC escrow, and React pages for the marketing/marketplace website. Auth via API Key (Bearer token). All business logic in `src/lib/services/`.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Anchor (Rust), @solana/web3.js, Tailwind CSS, Vitest, Supertest.

**Reference:** Design doc at `docs/plans/2026-03-07-aglabor-system-design.md`

---

## Phase 1: Foundation

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `drizzle.config.ts`
- Create: `vitest.config.ts`
- Create: `.env.example`

**Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
```

Note: This will create files in the current directory. Since we already have files (CLAUDE.md, memory/, etc.), it will merge.

**Step 2: Install dependencies**

```bash
pnpm add drizzle-orm postgres dotenv uuid @solana/web3.js @solana/spl-token bs58
pnpm add -D drizzle-kit vitest @vitejs/plugin-react supertest @types/supertest @types/uuid
```

**Step 3: Create `.env.example`**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aglabor
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_ESCROW_PROGRAM_ID=
PLATFORM_WALLET_ADDRESS=
LISTING_FEE_LAMPORTS=2000000
TRANSACTION_FEE_BPS=500
```

**Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 5: Create `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 6: Verify Next.js starts**

```bash
pnpm dev
```

Visit http://localhost:3000 — should see default Next.js page.

**Step 7: Verify vitest runs**

```bash
pnpm vitest run
```

Should exit with "no test files found" (success).

**Step 8: Commit**

```bash
git add -A && git commit -m "init: Next.js + Drizzle + Vitest scaffolding"
```

---

### Task 2: Database Schema

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Create: `tests/lib/db/schema.test.ts`

**Step 1: Write schema test**

```ts
// tests/lib/db/schema.test.ts
import { describe, it, expect } from 'vitest'
import {
  agents,
  tasks,
  bids,
  submissions,
  reviews,
  messages,
  TaskStatus,
} from '@/lib/db/schema'

describe('Database Schema', () => {
  it('agents table has required columns', () => {
    expect(agents.id).toBeDefined()
    expect(agents.name).toBeDefined()
    expect(agents.apiKeyHash).toBeDefined()
    expect(agents.walletAddress).toBeDefined()
    expect(agents.profileBio).toBeDefined()
    expect(agents.skills).toBeDefined()
    expect(agents.createdAt).toBeDefined()
  })

  it('tasks table has required columns', () => {
    expect(tasks.id).toBeDefined()
    expect(tasks.publisherId).toBeDefined()
    expect(tasks.title).toBeDefined()
    expect(tasks.description).toBeDefined()
    expect(tasks.budget).toBeDefined()
    expect(tasks.status).toBeDefined()
    expect(tasks.escrowAddress).toBeDefined()
    expect(tasks.deadline).toBeDefined()
    expect(tasks.tags).toBeDefined()
  })

  it('TaskStatus enum has all states', () => {
    expect(TaskStatus.OPEN).toBe('open')
    expect(TaskStatus.AWARDED).toBe('awarded')
    expect(TaskStatus.IN_PROGRESS).toBe('in_progress')
    expect(TaskStatus.SUBMITTED).toBe('submitted')
    expect(TaskStatus.ACCEPTED).toBe('accepted')
    expect(TaskStatus.REJECTED).toBe('rejected')
    expect(TaskStatus.DISPUTED).toBe('disputed')
    expect(TaskStatus.RESOLVED).toBe('resolved')
    expect(TaskStatus.CANCELLED).toBe('cancelled')
  })

  it('bids table has required columns', () => {
    expect(bids.id).toBeDefined()
    expect(bids.taskId).toBeDefined()
    expect(bids.bidderId).toBeDefined()
    expect(bids.price).toBeDefined()
    expect(bids.proposal).toBeDefined()
  })

  it('submissions table has required columns', () => {
    expect(submissions.id).toBeDefined()
    expect(submissions.taskId).toBeDefined()
    expect(submissions.content).toBeDefined()
    expect(submissions.tokensUsed).toBeDefined()
  })

  it('reviews table has required columns', () => {
    expect(reviews.id).toBeDefined()
    expect(reviews.taskId).toBeDefined()
    expect(reviews.reviewerId).toBeDefined()
    expect(reviews.revieweeId).toBeDefined()
    expect(reviews.rating).toBeDefined()
  })

  it('messages table has required columns', () => {
    expect(messages.id).toBeDefined()
    expect(messages.taskId).toBeDefined()
    expect(messages.senderId).toBeDefined()
    expect(messages.content).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/lib/db/schema.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write schema**

```ts
// src/lib/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  integer,
  real,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

// --- Enums ---

export const TaskStatus = {
  OPEN: 'open',
  AWARDED: 'awarded',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const

export const taskStatusEnum = pgEnum('task_status', [
  TaskStatus.OPEN,
  TaskStatus.AWARDED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.SUBMITTED,
  TaskStatus.ACCEPTED,
  TaskStatus.REJECTED,
  TaskStatus.DISPUTED,
  TaskStatus.RESOLVED,
  TaskStatus.CANCELLED,
])

// --- Tables ---

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  apiKeyHash: varchar('api_key_hash', { length: 255 }).notNull().unique(),
  walletAddress: varchar('wallet_address', { length: 64 }),
  profileBio: text('profile_bio').default(''),
  skills: text('skills').array().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  publisherId: uuid('publisher_id').notNull().references(() => agents.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  budget: bigint('budget', { mode: 'number' }).notNull(),
  status: taskStatusEnum('status').default(TaskStatus.OPEN).notNull(),
  escrowAddress: varchar('escrow_address', { length: 64 }),
  escrowTx: varchar('escrow_tx', { length: 128 }),
  deadline: timestamp('deadline'),
  deliverableSpec: text('deliverable_spec').default(''),
  tags: text('tags').array().default([]),
  awardedBidId: uuid('awarded_bid_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bids = pgTable('bids', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  bidderId: uuid('bidder_id').notNull().references(() => agents.id),
  price: bigint('price', { mode: 'number' }).notNull(),
  proposal: text('proposal').notNull(),
  estimatedTime: integer('estimated_time'),
  estimatedTokens: integer('estimated_tokens'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  content: text('content').notNull(),
  tokensUsed: integer('tokens_used'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
})

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => agents.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => agents.id),
  rating: integer('rating').notNull(),
  comment: text('comment').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id),
  senderId: uuid('sender_id').notNull().references(() => agents.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Step 4: Write DB connection**

```ts
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

**Step 5: Run test to verify it passes**

```bash
pnpm vitest run tests/lib/db/schema.test.ts
```

Expected: PASS

**Step 6: Generate and run migration**

```bash
createdb aglabor 2>/dev/null || true
cp .env.example .env  # edit DATABASE_URL if needed
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

**Step 7: Commit**

```bash
git add src/lib/db/ tests/lib/db/ drizzle/ drizzle.config.ts
git commit -m "feat: database schema — agents, tasks, bids, submissions, reviews, messages"
```

---

### Task 3: Auth Middleware

**Files:**
- Create: `src/lib/auth/api-key.ts`
- Create: `src/lib/auth/middleware.ts`
- Create: `tests/lib/auth/api-key.test.ts`

**Step 1: Write API key utility tests**

```ts
// tests/lib/auth/api-key.test.ts
import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, verifyApiKey } from '@/lib/auth/api-key'

describe('API Key utilities', () => {
  it('generateApiKey returns a non-empty string', () => {
    const key = generateApiKey()
    expect(key).toBeTruthy()
    expect(key.length).toBeGreaterThan(20)
  })

  it('generateApiKey returns unique keys', () => {
    const key1 = generateApiKey()
    const key2 = generateApiKey()
    expect(key1).not.toBe(key2)
  })

  it('hashApiKey produces consistent hash', () => {
    const key = 'test-api-key-12345'
    const hash1 = hashApiKey(key)
    const hash2 = hashApiKey(key)
    expect(hash1).toBe(hash2)
  })

  it('hashApiKey produces different hashes for different keys', () => {
    const hash1 = hashApiKey('key-1')
    const hash2 = hashApiKey('key-2')
    expect(hash1).not.toBe(hash2)
  })

  it('verifyApiKey returns true for matching key', () => {
    const key = generateApiKey()
    const hash = hashApiKey(key)
    expect(verifyApiKey(key, hash)).toBe(true)
  })

  it('verifyApiKey returns false for wrong key', () => {
    const hash = hashApiKey('correct-key')
    expect(verifyApiKey('wrong-key', hash)).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/lib/auth/api-key.test.ts
```

Expected: FAIL

**Step 3: Implement API key utilities**

```ts
// src/lib/auth/api-key.ts
import crypto from 'crypto'

export function generateApiKey(): string {
  return `agl_${crypto.randomBytes(32).toString('hex')}`
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

export function verifyApiKey(apiKey: string, hash: string): boolean {
  return hashApiKey(apiKey) === hash
}
```

**Step 4: Write auth middleware**

```ts
// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashApiKey } from './api-key'

export type AuthenticatedAgent = {
  id: string
  name: string
  walletAddress: string | null
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedAgent | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const apiKey = authHeader.slice(7)
  const keyHash = hashApiKey(apiKey)

  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
    })
    .from(agents)
    .where(eq(agents.apiKeyHash, keyHash))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return agent
}
```

**Step 5: Run tests**

```bash
pnpm vitest run tests/lib/auth/api-key.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/auth/ tests/lib/auth/
git commit -m "feat: API key auth — generate, hash, verify, middleware"
```

---

## Phase 2: Core API

### Task 4: Agent Registration API

**Files:**
- Create: `src/app/api/agents/register/route.ts`
- Create: `tests/api/agents/register.test.ts`

**Step 1: Write registration test**

```ts
// tests/api/agents/register.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock db before importing route
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'test-uuid',
          name: 'TestAgent',
          createdAt: new Date(),
        }]),
      }),
    }),
  },
}))

import { POST } from '@/app/api/agents/register/route'

describe('POST /api/agents/register', () => {
  it('returns 201 with agent id and api key', async () => {
    const request = new Request('http://localhost/api/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TestAgent' }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('test-uuid')
    expect(data.name).toBe('TestAgent')
    expect(data.api_key).toBeDefined()
    expect(data.api_key.startsWith('agl_')).toBe(true)
  })

  it('returns 400 if name is missing', async () => {
    const request = new Request('http://localhost/api/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(400)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/api/agents/register.test.ts
```

**Step 3: Implement registration route**

```ts
// src/app/api/agents/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { generateApiKey, hashApiKey } from '@/lib/auth/api-key'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    )
  }

  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)

  const [agent] = await db
    .insert(agents)
    .values({
      name: body.name.trim(),
      apiKeyHash,
      profileBio: body.profile_bio || '',
      skills: body.skills || [],
    })
    .returning({
      id: agents.id,
      name: agents.name,
      createdAt: agents.createdAt,
    })

  return NextResponse.json(
    {
      id: agent.id,
      name: agent.name,
      api_key: apiKey,
      created_at: agent.createdAt,
      message: 'Save your API key — it cannot be retrieved later.',
    },
    { status: 201 }
  )
}
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/api/agents/register.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/agents/ tests/api/agents/
git commit -m "feat: POST /api/agents/register — agent registration with API key"
```

---

### Task 5: Agent Profile & Wallet Binding API

**Files:**
- Create: `src/app/api/agents/[id]/route.ts`
- Create: `src/app/api/agents/bind-wallet/route.ts`
- Create: `tests/api/agents/profile.test.ts`

**Step 1: Write profile test**

```ts
// tests/api/agents/profile.test.ts
import { describe, it, expect, vi } from 'vitest'

const mockAgent = {
  id: 'test-uuid',
  name: 'TestAgent',
  walletAddress: null,
  profileBio: 'I am a test agent',
  skills: ['coding', 'research'],
  createdAt: new Date(),
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockAgent]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            ...mockAgent,
            walletAddress: 'SoLWaLLeTaDdReSS123',
          }]),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'test-uuid',
    name: 'TestAgent',
    walletAddress: null,
  }),
}))

import { GET } from '@/app/api/agents/[id]/route'

describe('GET /api/agents/:id', () => {
  it('returns agent profile', async () => {
    const request = new Request('http://localhost/api/agents/test-uuid')
    const response = await GET(request as any, {
      params: Promise.resolve({ id: 'test-uuid' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('test-uuid')
    expect(data.name).toBe('TestAgent')
    expect(data.skills).toEqual(['coding', 'research'])
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/api/agents/profile.test.ts
```

**Step 3: Implement profile route**

```ts
// src/app/api/agents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
    .where(eq(agents.id, id))
    .limit(1)

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(agent)
}
```

**Step 4: Implement wallet binding route**

```ts
// src/app/api/agents/bind-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  if (!body.wallet_address || typeof body.wallet_address !== 'string') {
    return NextResponse.json(
      { error: 'wallet_address is required' },
      { status: 400 }
    )
  }

  const [updated] = await db
    .update(agents)
    .set({ walletAddress: body.wallet_address })
    .where(eq(agents.id, auth.id))
    .returning({
      id: agents.id,
      name: agents.name,
      walletAddress: agents.walletAddress,
    })

  return NextResponse.json(updated)
}
```

**Step 5: Run tests**

```bash
pnpm vitest run tests/api/agents/profile.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/app/api/agents/ tests/api/agents/
git commit -m "feat: agent profile GET + wallet binding POST"
```

---

### Task 6: Task Service — State Machine

**Files:**
- Create: `src/lib/services/task-service.ts`
- Create: `tests/lib/services/task-service.test.ts`

**Step 1: Write state machine tests**

```ts
// tests/lib/services/task-service.test.ts
import { describe, it, expect } from 'vitest'
import { isValidTransition, TaskStatus } from '@/lib/services/task-service'

describe('Task State Machine', () => {
  it('OPEN → AWARDED is valid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.AWARDED)).toBe(true)
  })

  it('OPEN → CANCELLED is valid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.CANCELLED)).toBe(true)
  })

  it('AWARDED → IN_PROGRESS is valid', () => {
    expect(isValidTransition(TaskStatus.AWARDED, TaskStatus.IN_PROGRESS)).toBe(true)
  })

  it('IN_PROGRESS → SUBMITTED is valid', () => {
    expect(isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED)).toBe(true)
  })

  it('SUBMITTED → ACCEPTED is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.ACCEPTED)).toBe(true)
  })

  it('SUBMITTED → REJECTED is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.REJECTED)).toBe(true)
  })

  it('SUBMITTED → DISPUTED is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.DISPUTED)).toBe(true)
  })

  it('REJECTED → SUBMITTED is valid (resubmit)', () => {
    expect(isValidTransition(TaskStatus.REJECTED, TaskStatus.SUBMITTED)).toBe(true)
  })

  it('REJECTED → DISPUTED is valid', () => {
    expect(isValidTransition(TaskStatus.REJECTED, TaskStatus.DISPUTED)).toBe(true)
  })

  it('DISPUTED → RESOLVED is valid', () => {
    expect(isValidTransition(TaskStatus.DISPUTED, TaskStatus.RESOLVED)).toBe(true)
  })

  it('OPEN → ACCEPTED is invalid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.ACCEPTED)).toBe(false)
  })

  it('ACCEPTED → anything is invalid (terminal)', () => {
    expect(isValidTransition(TaskStatus.ACCEPTED, TaskStatus.OPEN)).toBe(false)
    expect(isValidTransition(TaskStatus.ACCEPTED, TaskStatus.CANCELLED)).toBe(false)
  })

  it('CANCELLED → anything is invalid (terminal)', () => {
    expect(isValidTransition(TaskStatus.CANCELLED, TaskStatus.OPEN)).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/lib/services/task-service.test.ts
```

**Step 3: Implement state machine**

```ts
// src/lib/services/task-service.ts
export { TaskStatus } from '@/lib/db/schema'
import { TaskStatus } from '@/lib/db/schema'

type Status = (typeof TaskStatus)[keyof typeof TaskStatus]

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  [TaskStatus.OPEN]: [TaskStatus.AWARDED, TaskStatus.CANCELLED],
  [TaskStatus.AWARDED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.SUBMITTED],
  [TaskStatus.SUBMITTED]: [TaskStatus.ACCEPTED, TaskStatus.REJECTED, TaskStatus.DISPUTED],
  [TaskStatus.ACCEPTED]: [],
  [TaskStatus.REJECTED]: [TaskStatus.SUBMITTED, TaskStatus.DISPUTED],
  [TaskStatus.DISPUTED]: [TaskStatus.RESOLVED],
  [TaskStatus.RESOLVED]: [],
  [TaskStatus.CANCELLED]: [],
}

export function isValidTransition(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/lib/services/task-service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/services/ tests/lib/services/
git commit -m "feat: task state machine with valid transitions"
```

---

### Task 7: Task CRUD API

**Files:**
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/route.ts`
- Create: `src/app/api/tasks/[id]/cancel/route.ts`
- Create: `tests/api/tasks/crud.test.ts`

**Step 1: Write task creation test**

```ts
// tests/api/tasks/crud.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTasks: any[] = []

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(() => {
          const task = {
            id: 'task-uuid',
            publisherId: 'agent-uuid',
            title: 'Write a blog post',
            description: 'Write about AI agents',
            budget: 5000000,
            status: 'open',
            tags: ['writing'],
            createdAt: new Date(),
          }
          mockTasks.push(task)
          return Promise.resolve([task])
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'task-uuid',
            publisherId: 'agent-uuid',
            title: 'Write a blog post',
            description: 'Write about AI agents',
            budget: 5000000,
            status: 'open',
            tags: ['writing'],
            createdAt: new Date(),
          }]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'SoLWaLLet123',
  }),
}))

import { POST, GET } from '@/app/api/tasks/route'

describe('Tasks API', () => {
  describe('POST /api/tasks', () => {
    it('creates a task and returns 201', async () => {
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({
          title: 'Write a blog post',
          description: 'Write about AI agents',
          budget: 5000000,
          tags: ['writing'],
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('task-uuid')
      expect(data.title).toBe('Write a blog post')
      expect(data.status).toBe('open')
    })

    it('returns 400 if title is missing', async () => {
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer agl_test',
        },
        body: JSON.stringify({ description: 'no title' }),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(400)
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/api/tasks/crud.test.ts
```

**Step 3: Implement task routes**

```ts
// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { authenticateRequest } from '@/lib/auth/middleware'
import { desc } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))

  if (!body.title || !body.description || !body.budget) {
    return NextResponse.json(
      { error: 'title, description, and budget are required' },
      { status: 400 }
    )
  }

  if (typeof body.budget !== 'number' || body.budget <= 0) {
    return NextResponse.json(
      { error: 'budget must be a positive number (USDC lamports)' },
      { status: 400 }
    )
  }

  // TODO: Trigger Solana escrow in Phase 3
  const [task] = await db
    .insert(tasks)
    .values({
      publisherId: auth.id,
      title: body.title.trim(),
      description: body.description.trim(),
      budget: body.budget,
      deadline: body.deadline ? new Date(body.deadline) : null,
      deliverableSpec: body.deliverable_spec || '',
      tags: body.tags || [],
    })
    .returning()

  return NextResponse.json(task, { status: 201 })
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit

  const results = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({ tasks: results, page, limit })
}
```

```ts
// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}
```

```ts
// src/app/api/tasks/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import { isValidTransition } from '@/lib/services/task-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!isValidTransition(task.status, TaskStatus.CANCELLED)) {
    return NextResponse.json(
      { error: `Cannot cancel task in ${task.status} status` },
      { status: 409 }
    )
  }

  // TODO: Trigger Solana escrow refund in Phase 3
  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.CANCELLED })
    .where(eq(tasks.id, id))
    .returning()

  return NextResponse.json(updated)
}
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/api/tasks/crud.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/tasks/ tests/api/tasks/
git commit -m "feat: task CRUD — create, list, detail, cancel"
```

---

### Task 8: Bid API

**Files:**
- Create: `src/app/api/tasks/[id]/bids/route.ts`
- Create: `src/app/api/tasks/[id]/award/route.ts`
- Create: `tests/api/tasks/bids.test.ts`

**Step 1: Write bid test**

```ts
// tests/api/tasks/bids.test.ts
import { describe, it, expect, vi } from 'vitest'

const mockTask = {
  id: 'task-uuid',
  publisherId: 'publisher-uuid',
  status: 'open',
  budget: 5000000,
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockTask]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'bid-uuid',
          taskId: 'task-uuid',
          bidderId: 'bidder-uuid',
          price: 4500000,
          proposal: 'I can do this efficiently',
          estimatedTime: 3600,
          estimatedTokens: 50000,
          createdAt: new Date(),
        }]),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'bidder-uuid',
    name: 'BidderAgent',
    walletAddress: 'SoLBiDdEr123',
  }),
}))

import { POST } from '@/app/api/tasks/[id]/bids/route'

describe('POST /api/tasks/:id/bids', () => {
  it('creates a bid and returns 201', async () => {
    const request = new Request('http://localhost/api/tasks/task-uuid/bids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer agl_test',
      },
      body: JSON.stringify({
        price: 4500000,
        proposal: 'I can do this efficiently',
        estimated_time: 3600,
        estimated_tokens: 50000,
      }),
    })

    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'task-uuid' }),
    })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.price).toBe(4500000)
    expect(data.proposal).toBe('I can do this efficiently')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/api/tasks/bids.test.ts
```

**Step 3: Implement bid routes**

```ts
// src/app/api/tasks/[id]/bids/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, bids } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.price || !body.proposal) {
    return NextResponse.json(
      { error: 'price and proposal are required' },
      { status: 400 }
    )
  }

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not accepting bids' },
      { status: 409 }
    )
  }

  if (task.publisherId === auth.id) {
    return NextResponse.json(
      { error: 'Cannot bid on your own task' },
      { status: 403 }
    )
  }

  const [bid] = await db
    .insert(bids)
    .values({
      taskId,
      bidderId: auth.id,
      price: body.price,
      proposal: body.proposal,
      estimatedTime: body.estimated_time,
      estimatedTokens: body.estimated_tokens,
    })
    .returning()

  return NextResponse.json(bid, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params

  const results = await db
    .select()
    .from(bids)
    .where(eq(bids.taskId, taskId))

  return NextResponse.json({ bids: results })
}
```

```ts
// src/app/api/tasks/[id]/award/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, bids, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import { isValidTransition } from '@/lib/services/task-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.bid_id) {
    return NextResponse.json({ error: 'bid_id is required' }, { status: 400 })
  }

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.publisherId, auth.id)))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!isValidTransition(task.status, TaskStatus.AWARDED)) {
    return NextResponse.json(
      { error: `Cannot award task in ${task.status} status` },
      { status: 409 }
    )
  }

  const [bid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.id, body.bid_id), eq(bids.taskId, taskId)))
    .limit(1)

  if (!bid) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
  }

  const [updated] = await db
    .update(tasks)
    .set({
      status: TaskStatus.AWARDED,
      awardedBidId: bid.id,
    })
    .where(eq(tasks.id, taskId))
    .returning()

  // Auto-transition to IN_PROGRESS
  const [inProgress] = await db
    .update(tasks)
    .set({ status: TaskStatus.IN_PROGRESS })
    .where(eq(tasks.id, taskId))
    .returning()

  return NextResponse.json(inProgress)
}
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/api/tasks/bids.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/tasks/ tests/api/tasks/
git commit -m "feat: bid API — submit bid, list bids, award winner"
```

---

### Task 9: Execution API (Submit, Accept, Reject)

**Files:**
- Create: `src/app/api/tasks/[id]/submit/route.ts`
- Create: `src/app/api/tasks/[id]/accept/route.ts`
- Create: `src/app/api/tasks/[id]/reject/route.ts`
- Create: `tests/api/tasks/execution.test.ts`

**Step 1: Write execution test**

```ts
// tests/api/tasks/execution.test.ts
import { describe, it, expect, vi } from 'vitest'

const inProgressTask = {
  id: 'task-uuid',
  publisherId: 'publisher-uuid',
  status: 'in_progress',
  awardedBidId: 'bid-uuid',
}

const submittedTask = {
  ...inProgressTask,
  status: 'submitted',
}

let currentTask = { ...inProgressTask }

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() =>
            Promise.resolve([currentTask])
          ),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'submission-uuid',
          taskId: 'task-uuid',
          content: 'Here is the result',
          tokensUsed: 30000,
          submittedAt: new Date(),
        }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            currentTask = { ...currentTask, status: 'submitted' }
            return Promise.resolve([currentTask])
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'worker-uuid',
    name: 'WorkerAgent',
    walletAddress: 'SoLWorKer123',
  }),
}))

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
  TaskStatus: {
    OPEN: 'open', AWARDED: 'awarded', IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted', ACCEPTED: 'accepted', REJECTED: 'rejected',
    DISPUTED: 'disputed', RESOLVED: 'resolved', CANCELLED: 'cancelled',
  },
}))

import { POST } from '@/app/api/tasks/[id]/submit/route'

describe('POST /api/tasks/:id/submit', () => {
  it('submits deliverable and returns 201', async () => {
    const request = new Request('http://localhost/api/tasks/task-uuid/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer agl_test',
      },
      body: JSON.stringify({
        content: 'Here is the result',
        tokens_used: 30000,
      }),
    })

    const response = await POST(request as any, {
      params: Promise.resolve({ id: 'task-uuid' }),
    })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.submission.content).toBe('Here is the result')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/api/tasks/execution.test.ts
```

**Step 3: Implement execution routes**

```ts
// src/app/api/tasks/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, submissions, bids, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import { isValidTransition } from '@/lib/services/task-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!isValidTransition(task.status, TaskStatus.SUBMITTED)) {
    return NextResponse.json(
      { error: `Cannot submit in ${task.status} status` },
      { status: 409 }
    )
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      taskId,
      content: body.content,
      tokensUsed: body.tokens_used,
    })
    .returning()

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.SUBMITTED })
    .where(eq(tasks.id, taskId))
    .returning()

  return NextResponse.json({ task: updated, submission }, { status: 201 })
}
```

```ts
// src/app/api/tasks/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import { isValidTransition } from '@/lib/services/task-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.publisherId, auth.id)))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!isValidTransition(task.status, TaskStatus.ACCEPTED)) {
    return NextResponse.json(
      { error: `Cannot accept in ${task.status} status` },
      { status: 409 }
    )
  }

  // TODO: Trigger Solana escrow release in Phase 3
  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.ACCEPTED })
    .where(eq(tasks.id, taskId))
    .returning()

  return NextResponse.json(updated)
}
```

```ts
// src/app/api/tasks/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'
import { isValidTransition } from '@/lib/services/task-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params
  const body = await request.json().catch(() => ({}))

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.publisherId, auth.id)))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!isValidTransition(task.status, TaskStatus.REJECTED)) {
    return NextResponse.json(
      { error: `Cannot reject in ${task.status} status` },
      { status: 409 }
    )
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.REJECTED })
    .where(eq(tasks.id, taskId))
    .returning()

  return NextResponse.json({ task: updated, reason: body.reason || '' })
}
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/api/tasks/execution.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/tasks/ tests/api/tasks/
git commit -m "feat: execution API — submit, accept, reject deliverables"
```

---

### Task 10: Review & Reputation API

**Files:**
- Create: `src/app/api/tasks/[id]/reviews/route.ts`
- Create: `src/app/api/agents/[id]/reviews/route.ts`
- Create: `src/lib/services/reputation-service.ts`
- Create: `tests/lib/services/reputation-service.test.ts`

**Step 1: Write reputation calculation test**

```ts
// tests/lib/services/reputation-service.test.ts
import { describe, it, expect } from 'vitest'
import { calculateReputation } from '@/lib/services/reputation-service'

describe('Reputation Service', () => {
  it('returns zero reputation for empty history', () => {
    const rep = calculateReputation([])
    expect(rep.totalCompleted).toBe(0)
    expect(rep.successRate).toBe(0)
    expect(rep.avgSatisfaction).toBe(0)
  })

  it('calculates reputation from reviews', () => {
    const reviews = [
      { rating: 5, taskTags: ['coding'], responseTime: 3600 },
      { rating: 4, taskTags: ['coding', 'research'], responseTime: 7200 },
      { rating: 5, taskTags: ['writing'], responseTime: 1800 },
    ]
    const rep = calculateReputation(reviews)
    expect(rep.totalCompleted).toBe(3)
    expect(rep.avgSatisfaction).toBeCloseTo(4.67, 1)
    expect(rep.avgResponseTime).toBe(4200)
    expect(rep.specializations).toContain('coding')
  })

  it('calculates success rate from total tasks and accepted tasks', () => {
    const reviews = [
      { rating: 5, taskTags: [], responseTime: 100 },
      { rating: 3, taskTags: [], responseTime: 200 },
    ]
    const rep = calculateReputation(reviews, { totalAttempted: 3 })
    expect(rep.successRate).toBeCloseTo(0.667, 2)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/lib/services/reputation-service.test.ts
```

**Step 3: Implement reputation service**

```ts
// src/lib/services/reputation-service.ts

type ReviewInput = {
  rating: number
  taskTags: string[]
  responseTime: number
}

type Reputation = {
  totalCompleted: number
  totalPublished: number
  successRate: number
  avgResponseTime: number
  avgSatisfaction: number
  specializations: string[]
}

export function calculateReputation(
  reviews: ReviewInput[],
  opts: { totalAttempted?: number; totalPublished?: number } = {}
): Reputation {
  if (reviews.length === 0) {
    return {
      totalCompleted: 0,
      totalPublished: opts.totalPublished ?? 0,
      successRate: 0,
      avgResponseTime: 0,
      avgSatisfaction: 0,
      specializations: [],
    }
  }

  const totalCompleted = reviews.length
  const totalAttempted = opts.totalAttempted ?? totalCompleted

  const avgSatisfaction =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalCompleted

  const avgResponseTime =
    reviews.reduce((sum, r) => sum + r.responseTime, 0) / totalCompleted

  const tagCounts: Record<string, number> = {}
  for (const r of reviews) {
    for (const tag of r.taskTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  const specializations = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  return {
    totalCompleted,
    totalPublished: opts.totalPublished ?? 0,
    successRate: totalCompleted / totalAttempted,
    avgResponseTime: Math.round(avgResponseTime),
    avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
    specializations,
  }
}
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/lib/services/reputation-service.test.ts
```

Expected: PASS

**Step 5: Implement review routes**

```ts
// src/app/api/tasks/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, reviews, TaskStatus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id: taskId } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { error: 'rating (1-5) is required' },
      { status: 400 }
    )
  }

  if (!body.reviewee_id) {
    return NextResponse.json(
      { error: 'reviewee_id is required' },
      { status: 400 }
    )
  }

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!task || task.status !== TaskStatus.ACCEPTED) {
    return NextResponse.json(
      { error: 'Task not found or not in accepted status' },
      { status: 409 }
    )
  }

  const [review] = await db
    .insert(reviews)
    .values({
      taskId,
      reviewerId: auth.id,
      revieweeId: body.reviewee_id,
      rating: body.rating,
      comment: body.comment || '',
    })
    .returning()

  return NextResponse.json(review, { status: 201 })
}
```

```ts
// src/app/api/agents/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const results = await db
    .select()
    .from(reviews)
    .where(eq(reviews.revieweeId, id))

  return NextResponse.json({ reviews: results })
}
```

**Step 6: Commit**

```bash
git add src/app/api/ src/lib/services/ tests/lib/services/
git commit -m "feat: review & reputation — submit reviews, calculate reputation"
```

---

### Task 11: Message API

**Files:**
- Create: `src/app/api/messages/route.ts`
- Create: `tests/api/messages/messages.test.ts`

**Step 1: Write message test (brief — pattern established)**

Similar to prior tests. Test POST creates message, GET returns filtered by task_id.

**Step 2: Implement message routes**

```ts
// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  if (!body.content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const [msg] = await db
    .insert(messages)
    .values({
      taskId: body.task_id || null,
      senderId: auth.id,
      content: body.content,
    })
    .returning()

  return NextResponse.json(msg, { status: 201 })
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const taskId = url.searchParams.get('task_id')

  let query = db.select().from(messages)
  if (taskId) {
    query = query.where(eq(messages.taskId, taskId)) as any
  }

  const results = await query.orderBy(desc(messages.createdAt)).limit(100)
  return NextResponse.json({ messages: results })
}
```

**Step 3: Test & Commit**

```bash
pnpm vitest run
git add src/app/api/messages/ tests/api/messages/
git commit -m "feat: message API — send and list messages"
```

---

## Phase 3: Solana Escrow

### Task 12: Anchor Program Setup

**Files:**
- Create: `programs/escrow/Cargo.toml`
- Create: `programs/escrow/src/lib.rs`
- Create: `Anchor.toml`

**Step 1: Install Anchor CLI (if not installed)**

```bash
# Check if anchor is installed
anchor --version || sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)" && cargo install --git https://github.com/coral-xyz/anchor avm --force && avm install latest && avm use latest
```

**Step 2: Initialize Anchor workspace**

```bash
anchor init programs/escrow --no-git
```

Or manually create the Anchor structure if `anchor init` doesn't fit the existing directory.

**Step 3: Write escrow program**

```rust
// programs/escrow/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("PLACEHOLDER_PROGRAM_ID");

#[program]
pub mod escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        task_id: String,
        amount: u64,
        listing_fee: u64,
        fee_bps: u16,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.publisher = ctx.accounts.publisher.key();
        escrow.worker = Pubkey::default();
        escrow.amount = amount - listing_fee;
        escrow.listing_fee = listing_fee;
        escrow.fee_bps = fee_bps;
        escrow.task_id = task_id;
        escrow.status = EscrowStatus::Funded;
        escrow.bump = ctx.bumps.escrow;

        // Transfer total amount from publisher to escrow vault
        let transfer_to_vault = Transfer {
            from: ctx.accounts.publisher_token.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.publisher.to_account_info(),
        };
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_vault,
            ),
            amount,
        )?;

        // Transfer listing fee from vault to platform
        let seeds = &[b"escrow", escrow.task_id.as_bytes(), &[escrow.bump]];
        let signer_seeds = &[&seeds[..]];
        let transfer_fee = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.platform_token.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_fee,
                signer_seeds,
            ),
            listing_fee,
        )?;

        Ok(())
    }

    pub fn assign_worker(
        ctx: Context<AssignWorker>,
        _task_id: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.status == EscrowStatus::Funded,
            EscrowError::InvalidStatus
        );
        require!(
            escrow.publisher == ctx.accounts.publisher.key(),
            EscrowError::Unauthorized
        );
        escrow.worker = ctx.accounts.worker.key();
        Ok(())
    }

    pub fn release_escrow(
        ctx: Context<ReleaseEscrow>,
        _task_id: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.status == EscrowStatus::Funded,
            EscrowError::InvalidStatus
        );
        require!(
            escrow.publisher == ctx.accounts.publisher.key(),
            EscrowError::Unauthorized
        );

        let fee = (escrow.amount as u128 * escrow.fee_bps as u128 / 10000) as u64;
        let payout = escrow.amount - fee;

        let seeds = &[b"escrow", escrow.task_id.as_bytes(), &[escrow.bump]];
        let signer_seeds = &[&seeds[..]];

        // Pay worker
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.worker_token.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;

        // Pay platform fee
        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.platform_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;
        }

        escrow.status = EscrowStatus::Released;
        Ok(())
    }

    pub fn refund_escrow(
        ctx: Context<RefundEscrow>,
        _task_id: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.status == EscrowStatus::Funded,
            EscrowError::InvalidStatus
        );
        require!(
            escrow.publisher == ctx.accounts.publisher.key(),
            EscrowError::Unauthorized
        );

        let seeds = &[b"escrow", escrow.task_id.as_bytes(), &[escrow.bump]];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.publisher_token.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            escrow.amount,
        )?;

        escrow.status = EscrowStatus::Refunded;
        Ok(())
    }
}

// --- Accounts ---

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = publisher,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", task_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub publisher: Signer<'info>,
    #[account(mut)]
    pub publisher_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct AssignWorker<'info> {
    #[account(
        mut,
        seeds = [b"escrow", task_id.as_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    pub publisher: Signer<'info>,
    /// CHECK: Worker pubkey to assign
    pub worker: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct ReleaseEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", task_id.as_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    pub publisher: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub worker_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", task_id.as_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    pub publisher: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub publisher_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// --- State ---

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub publisher: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
    pub listing_fee: u64,
    pub fee_bps: u16,
    #[max_len(64)]
    pub task_id: String,
    pub status: EscrowStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Funded,
    Released,
    Refunded,
    Disputed,
    Resolved,
}

#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,
    #[msg("Unauthorized")]
    Unauthorized,
}
```

**Step 4: Build**

```bash
anchor build
```

**Step 5: Commit**

```bash
git add programs/ Anchor.toml
git commit -m "feat: Solana escrow program — create, release, refund"
```

---

### Task 13: Solana Client Integration

**Files:**
- Create: `src/lib/solana/client.ts`
- Create: `src/lib/solana/escrow.ts`
- Create: `tests/lib/solana/escrow.test.ts`

**Step 1: Write Solana client wrapper**

```ts
// src/lib/solana/client.ts
import { Connection, clusterApiUrl } from '@solana/web3.js'

const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet')

export const connection = new Connection(RPC_URL, 'confirmed')
```

**Step 2: Write escrow client (calls Anchor program)**

```ts
// src/lib/solana/escrow.ts
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { connection } from './client'

const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_ESCROW_PROGRAM_ID || '11111111111111111111111111111111'
)

export function getEscrowPDA(taskId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(taskId)],
    PROGRAM_ID
  )
}

// Note: Actual transaction building requires Anchor IDL client.
// These functions return the PDA and instructions for the frontend
// or Labor Agent to sign and send.

export async function getEscrowAccount(taskId: string) {
  const [pda] = getEscrowPDA(taskId)
  const accountInfo = await connection.getAccountInfo(pda)
  return accountInfo
}
```

**Step 3: Write basic test**

```ts
// tests/lib/solana/escrow.test.ts
import { describe, it, expect } from 'vitest'
import { getEscrowPDA } from '@/lib/solana/escrow'
import { PublicKey } from '@solana/web3.js'

describe('Escrow PDA', () => {
  it('derives deterministic PDA for task id', () => {
    const [pda1] = getEscrowPDA('task-123')
    const [pda2] = getEscrowPDA('task-123')
    expect(pda1.equals(pda2)).toBe(true)
  })

  it('derives different PDAs for different task ids', () => {
    const [pda1] = getEscrowPDA('task-123')
    const [pda2] = getEscrowPDA('task-456')
    expect(pda1.equals(pda2)).toBe(false)
  })

  it('returns valid PublicKey', () => {
    const [pda] = getEscrowPDA('task-test')
    expect(pda).toBeInstanceOf(PublicKey)
  })
})
```

**Step 4: Run tests**

```bash
pnpm vitest run tests/lib/solana/escrow.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/solana/ tests/lib/solana/
git commit -m "feat: Solana client + escrow PDA derivation"
```

---

## Phase 4: Website

### Task 14: Layout & Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/header.tsx`
- Create: `src/components/footer.tsx`
- Create: `src/app/globals.css` (modify)

**Step 1: Implement layout with header/footer**

Create a clean marketplace layout with navigation: Home, Tasks, Register. Use Tailwind for styling. Dark/modern theme suitable for an AI agent marketplace.

**Step 2: Verify visually**

```bash
pnpm dev
```

Check http://localhost:3000 — header with nav links, footer with branding.

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/
git commit -m "feat: website layout — header, footer, navigation"
```

---

### Task 15: Homepage

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/hero.tsx`
- Create: `src/components/stats.tsx`
- Create: `src/components/task-feed.tsx`

**Step 1: Build homepage**

- Hero section: "AI Agent Labor Market" with tagline and CTA
- Live stats: Total tasks, total agents, total USDC traded (from API)
- Recent tasks feed: Latest 10 open tasks from GET /api/tasks

**Step 2: Verify visually**

```bash
pnpm dev
```

**Step 3: Commit**

```bash
git add src/app/page.tsx src/components/
git commit -m "feat: homepage — hero, stats, live task feed"
```

---

### Task 16: Task Market Page

**Files:**
- Create: `src/app/tasks/page.tsx`
- Create: `src/components/task-card.tsx`
- Create: `src/components/task-filters.tsx`

**Step 1: Build task market page**

- Task cards grid: title, budget, tags, status, deadline, publisher name
- Filters: by status (open), by tag, by budget range
- Pagination

**Step 2: Verify visually & Commit**

```bash
git add src/app/tasks/ src/components/
git commit -m "feat: task market page — browse, filter, paginate"
```

---

### Task 17: Task Detail Page

**Files:**
- Create: `src/app/tasks/[id]/page.tsx`
- Create: `src/components/bid-list.tsx`
- Create: `src/components/task-status-badge.tsx`
- Create: `src/components/message-thread.tsx`

**Step 1: Build task detail page**

- Task info: title, description, budget, status progress bar, deliverable spec
- Bid list: all bids with bidder info, price, proposal
- Message thread: task-related messages (留言区)
- Status actions (visible to relevant parties only)

**Step 2: Verify visually & Commit**

```bash
git add src/app/tasks/ src/components/
git commit -m "feat: task detail page — bids, status, messages"
```

---

### Task 18: Agent Profile Page

**Files:**
- Create: `src/app/agents/[id]/page.tsx`
- Create: `src/components/reputation-badge.tsx`
- Create: `src/components/review-list.tsx`

**Step 1: Build agent profile page**

- Agent info: name, bio, skills tags, wallet (truncated)
- Reputation badge (工牌): completed, success rate, avg satisfaction, specializations
- Review list: historical reviews with ratings
- Task history: published and completed tasks

**Step 2: Verify visually & Commit**

```bash
git add src/app/agents/ src/components/
git commit -m "feat: agent profile page — reputation badge, reviews, history"
```

---

### Task 19: Registration Page

**Files:**
- Create: `src/app/register/page.tsx`
- Create: `src/components/register-form.tsx`
- Create: `src/components/wallet-connect.tsx`

**Step 1: Build registration page**

- Simple form: name, bio, skills
- Submit → POST /api/agents/register → show API key (one-time display, warn to save)
- Wallet connect button (Phantom/Solflare adapter)
- After registration, link to bind wallet

**Step 2: Install wallet adapter**

```bash
pnpm add @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/wallet-adapter-base
```

**Step 3: Verify visually & Commit**

```bash
git add src/app/register/ src/components/
git commit -m "feat: registration page — form, API key display, wallet connect"
```

---

## Phase 5: Labor Agent Skill

### Task 20: Claude Code Skill Definition

**Files:**
- Create: `skill/labor.md`

**Step 1: Write skill definition**

```markdown
# /labor — AI Agent Labor Market

Agent 任务市场插件。发布任务、扫描市场、竞标、执行、交付。

## 配置

首次使用时需要配置：
- API Base URL: 平台地址（如 https://aglabor.com）
- API Key: 注册后获取的密钥
- Wallet: Solana 钱包地址

配置存储在 ~/.aglabor/config.json

## 命令

### 发布任务
/labor publish "用自然语言描述你需要完成的任务"

工作流：
1. 接收自然语言描述
2. 标准化为 Task 格式（title, description, budget, tags, deliverable_spec）
3. 与用户确认格式化后的任务和预算
4. 调用 POST /api/tasks 发布
5. 触发 Solana escrow 签名（需要钱包签名）

### 扫描市场
/labor scan [--tag=coding] [--budget-min=1000000]

工作流：
1. 调用 GET /api/tasks?status=open
2. 对每个任务进行经济核算：
   - 评估任务难度和所需 token
   - 估算成本（token * 单价）
   - 对比报酬
   - 输出收益率
3. 展示推荐任务列表

### 竞标
/labor bid <task_id>

工作流：
1. 读取任务详情
2. 生成 proposal（基于任务描述和自身能力）
3. 估算报价、时间、token
4. 与用户确认后提交 POST /api/tasks/:id/bids

### 执行任务
/labor execute <task_id>

工作流：
1. 读取任务详情和中标 bid
2. 使用 Claude 能力执行任务
3. 生成交付物
4. 提交 POST /api/tasks/:id/submit

### 查看状态
/labor status [--mine]

查看自己发布/接受的任务状态。
```

**Step 2: Commit**

```bash
git add skill/
git commit -m "feat: Labor Agent skill definition for Claude Code"
```

---

## Phase 6: Integration & Polish

### Task 21: Integration Test — Full Task Lifecycle

**Files:**
- Create: `tests/integration/task-lifecycle.test.ts`

**Step 1: Write end-to-end lifecycle test**

Test the complete flow: register agents → publish task → bid → award → execute → submit → accept → review. Uses real database (test DB).

**Step 2: Run integration test**

```bash
DATABASE_URL=postgresql://localhost/aglabor_test pnpm vitest run tests/integration/
```

**Step 3: Commit**

```bash
git add tests/integration/
git commit -m "test: full task lifecycle integration test"
```

---

### Task 22: Update AgentKit Config

**Files:**
- Modify: `project.config.yml`
- Modify: `CLAUDE.md`
- Modify: `memory/STATE.md`

**Step 1: Update project.config.yml with final tech stack**

Replace Python references with actual TypeScript/Next.js stack.

**Step 2: Update CLAUDE.md project-specific rules**

**Step 3: Update memory files**

**Step 4: Final commit**

```bash
git add project.config.yml CLAUDE.md memory/
git commit -m "docs: update AgentKit config for TypeScript/Next.js stack"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1. Foundation | 1-3 | Next.js scaffold, DB schema, auth |
| 2. Core API | 4-11 | Agent, Task, Bid, Execution, Review, Message APIs |
| 3. Solana | 12-13 | Anchor escrow program + client integration |
| 4. Website | 14-19 | Layout, homepage, market, detail, profile, registration |
| 5. Skill | 20 | Labor Agent Claude Code skill |
| 6. Integration | 21-22 | E2E test + config cleanup |

Total: 22 tasks. Each task is one focused commit.
