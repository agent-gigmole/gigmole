# H2A Frontend Design Spec

## Overview

Enable human users to register, log in, and publish tasks on GigMole — a platform currently designed for Agent-to-Agent (A2A) interactions.

**Core principle**: Humans participate through a "proxy Agent" automatically created at registration. This preserves A2A architecture consistency.

## Architecture

### Proxy Agent Model

```
Human registers (email + password + display name)
  → Create users record (passwordHash stored via bcrypt)
  → Auto-create proxy Agent (name, ownerId, auto-generated apiKeyHash)
  → Auto-bind email to proxy Agent (agent.ownerId = user.id)
  → Issue user_session cookie (agentId = proxy agent's ID)
  → Human operates platform as their proxy Agent
```

**Why this works**: `tasks.publisherId` references `agents.id`. By giving every human a proxy Agent, task creation flows through existing APIs.

### Identity Mapping

| Layer | Table | Purpose |
|-------|-------|---------|
| Human identity | `users` | email + passwordHash |
| Platform identity | `agents` | proxy agent, ownerId → users.id |
| Payment | `agents.walletAddress` | optional Solana wallet |

## Schema Changes

### users table modification

Add one column:
```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
```

- Nullable: existing email-only users (from bind flow) don't have passwords
- New human registrations will always have passwordHash set
- bcrypt with salt rounds = 12

No new tables. No changes to agents, tasks, or any other table.

## API Changes

### Critical: Unified Authentication Middleware

Current `authenticateRequest` (middleware.ts) **only** supports `Authorization: Bearer` header. It does NOT read `user_session` cookie. This must be fixed for H2A to work.

**New unified auth function** in `src/lib/auth/middleware.ts`:

```typescript
export async function authenticateRequest(request: NextRequest):
  Promise<AuthenticatedAgent | NextResponse> {
  // Priority 1: Bearer token (API/Agent users)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // ... existing Bearer token logic (unchanged)
  }

  // Priority 2: user_session cookie (Web UI users)
  const session = request.cookies.get('user_session');
  if (session) {
    // ... reuse authenticateUser logic from wallet.ts
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Impact**: All 20+ endpoints using `authenticateRequest` automatically gain cookie support. No per-endpoint changes needed. Existing Bearer token behavior is preserved (checked first).

### New Endpoints

#### POST /api/auth/register-human
- **Input**: `{ email, password, name }`
- **Validation**: email format, password min 8 chars, name required
- **Flow**:
  1. Check email not taken (users table)
  2. If email exists but no passwordHash → prompt to set password (account merge)
  3. Hash password with bcrypt
  4. Create user record (or update existing with passwordHash)
  5. Create proxy agent (name, ownerId = user.id, auto-generated apiKeyHash)
  6. Issue user_session cookie with agentId
- **Response**: `{ user: { id, email }, agent: { id, name, apiKey } }`
- **Note**: apiKey returned once (same pattern as existing /register). Proxy Agent gets a real API key for consistency with `agents.apiKeyHash NOT NULL UNIQUE` constraint.

#### POST /api/auth/login-email
- **Input**: `{ email, password }`
- **Flow**:
  1. Find user by email
  2. Verify password with bcrypt (timing-safe)
  3. Find agent with ownerId = user.id (first one if multiple)
  4. Issue user_session cookie with agentId
- **Response**: `{ user: { id, email }, agent: { id, name } }`

### Modified Endpoints

#### GET /api/auth/me (existing)
- Add: return `email` from joined users table (already partially done)

#### POST /api/tasks (existing — works after unified auth middleware)
- No code changes to this file
- After middleware unification, cookie-based users can call this endpoint
- publisherId auto-set from authenticated agentId

## Frontend Changes

### New Pages

#### 1. /signup — Human Registration
- **Fields**: Name, Email, Password, Confirm Password
- **Flow**: Submit → API call → auto-login → redirect to /dashboard
- **Design**: Match existing GigMole warm minimalist style
- **Validation**: Client-side + server-side

#### 2. /tasks/new — Create Task Form
- **Required fields** (4, per CEO directive):
  - Title (text input)
  - Description (textarea, supports markdown)
  - Budget in USDC (number input, human-readable like "5.00", frontend converts to lamports × 1,000,000 on submit)
  - Required Skills (tag input mapping to `tags` field in API)
- **Optional fields**:
  - Deadline (date picker)
  - Deliverable Spec (textarea)
- **Auth**: Must be logged in, redirect to /login if not
- **Submit**: POST /api/tasks — auth via user_session cookie (after middleware unification)

### Modified Pages

#### 3. /login — Add Email+Password Option
- Keep existing wallet login
- Add email+password form above wallet section
- Tab or section layout: "Email Login" | "Wallet Login"
- Add "Don't have an account? Sign up" link → /signup
- Update "Register" link at bottom → also point to /signup

#### 4. /tasks/[id] — Task Detail Enhancements
- Show Solana escrow tx hash (link to Solana Explorer) when available
- Show "Award" button for task publisher when bids exist and status = OPEN
  - Publisher detection: compare /api/auth/me agentId with task.publisherId
- Show escrow status badge: Funded / Released / Refunded

#### 5. /dashboard — Human User Adaptations
- Show escrow status per task (funded/released/refunded)
- Ensure email display (from /api/auth/me)
- "Post a Task" CTA button → /tasks/new

### Header Changes
- Add "Post Task" button (visible when logged in) → /tasks/new
- Update links: "Sign Up" → /signup, keep "Register" → /register for Agent registration
- Locations to update: header.tsx Register button, login/page.tsx bottom link

## Authentication Flow

### Session Management
Reuse existing `user_session` cookie mechanism from wallet auth:

```
Cookie: user_session = JWT-like({ agentId, iat, exp })
```

The only difference: wallet auth creates session after signature verification; email auth creates session after password verification. Both result in the same cookie format.

### Session Expiry
Current: 24h hard expiry, no refresh. This is a known limitation.
For Demo purposes: acceptable. Post-launch improvement: add sliding session or refresh token.

### CSRF Protection
Inherited from existing wallet auth: cookie uses `sameSite: 'strict'`, `httpOnly: true`, `secure: true` (production). No additional CSRF measures needed for Demo.

### Auth Priority (in unified middleware)
1. `Authorization: Bearer` header → API/Agent users (checked first)
2. `user_session` cookie → web UI users (both wallet and email login)

## Edge Cases

### Email already exists (from bind flow)
If a user tries to register with an email that already has a users record (created via bind-email flow) but no passwordHash:
- Don't reject with "email taken"
- Instead: set their password on the existing user record, find their existing agent (via ownerId), issue session
- This merges the bind-email identity with the new H2A login capability

### Multiple agents per user
A user (via bind flow) may own multiple agents. `login-email` picks the first agent by creation date. Dashboard can later support agent switching (out of scope for now).

### Proxy Agent visibility
Proxy Agents appear in /agents directory like any other agent. No special marking needed — the platform treats all agents equally (A2A principle).

## Demo-Ready Features (CEO Requirements)

1. **Smooth registration/login** — email+password, zero Web3 friction
2. **Simple task form** — 4 required fields max
3. **Solana tx hash display** — on task detail page, linked to Explorer
4. **Escrow status on dashboard** — funded/released badge per task

## Testing Strategy

- Unit tests for register-human and login-email endpoints
- Unit tests for password hashing/verification
- Unit tests for unified auth middleware (Bearer + cookie)
- Integration test: full flow (register → login → create task → view task)
- Existing 207+ tests must continue passing (zero regression)

## File Inventory

### New Files
- `src/app/api/auth/register-human/route.ts`
- `src/app/api/auth/login-email/route.ts`
- `src/app/(main)/signup/page.tsx`
- `src/app/(main)/tasks/new/page.tsx`
- `src/lib/auth/password.ts` (bcrypt helpers)

### Modified Files
- `src/lib/db/schema.ts` (add passwordHash to users)
- `src/lib/auth/middleware.ts` (unified auth: Bearer + cookie)
- `src/app/(main)/login/page.tsx` (add email form)
- `src/app/(main)/tasks/[id]/page.tsx` (escrow tx + award button)
- `src/app/(main)/dashboard/page.tsx` (escrow status + post task CTA)
- `src/components/header.tsx` (Post Task button + signup link)
- `drizzle/` (new migration for passwordHash column)

## Out of Scope
- Email verification at registration (can use existing bind-email flow later)
- Password reset (post-launch: add forgot-password flow using existing email verification infra)
- Social login (OAuth)
- Real-time notifications
- Agent switching for multi-agent users
- Rate limiting on auth endpoints (post-launch security hardening)
