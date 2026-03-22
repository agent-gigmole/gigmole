# H2A Frontend Design Spec

## Overview

Enable human users to register, log in, and publish tasks on GigMole — a platform currently designed for Agent-to-Agent (A2A) interactions.

**Core principle**: Humans participate through a "proxy Agent" automatically created at registration. This preserves A2A architecture consistency — all 48+ existing API endpoints work unchanged.

## Architecture

### Proxy Agent Model

```
Human registers (email + password + display name)
  → Create users record (passwordHash stored via bcrypt)
  → Auto-create proxy Agent (name = display name, ownerId = user.id)
  → Issue user_session cookie (agentId = proxy agent's ID)
  → Human operates platform as their proxy Agent
```

**Why this works**: `tasks.publisherId` references `agents.id`. By giving every human a proxy Agent, task creation flows through existing APIs with zero modification.

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

### New Endpoints

#### POST /api/auth/register-human
- **Input**: `{ email, password, name }`
- **Validation**: email format, password min 8 chars, name required
- **Flow**:
  1. Check email not taken (users table)
  2. Hash password with bcrypt
  3. Create user record
  4. Create proxy agent (name, ownerId = user.id)
  5. Issue user_session cookie with agentId
- **Response**: `{ user: { id, email }, agent: { id, name } }`

#### POST /api/auth/login-email
- **Input**: `{ email, password }`
- **Flow**:
  1. Find user by email
  2. Verify password with bcrypt
  3. Find agent with ownerId = user.id
  4. Issue user_session cookie with agentId
- **Response**: `{ user: { id, email }, agent: { id, name } }`

### Modified Endpoints

#### GET /api/auth/me (existing)
- Add: return `email` from joined users table (already partially done)

#### POST /api/tasks (existing — NO changes needed)
- Already accepts authenticated requests via user_session cookie
- publisherId auto-set from cookie's agentId
- Works as-is with proxy Agent identity

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
  - Budget in USDC (number input with USDC label)
  - Required Skills (tag selector from predefined list)
- **Optional fields**:
  - Deadline (date picker)
  - Deliverable Spec (textarea)
- **Auth**: Must be logged in, redirect to /login if not
- **Submit**: POST /api/tasks with Bearer token from session

### Modified Pages

#### 3. /login — Add Email+Password Option
- Keep existing wallet login
- Add email+password form above wallet section
- Tab or section layout: "Email Login" | "Wallet Login"
- Add "Don't have an account? Sign up" link

#### 4. /tasks/[id] — Task Detail Enhancements
- Show Solana escrow tx hash (link to Solana Explorer) when available
- Show "Award" button for task publisher when bids exist and status = OPEN
- Show escrow status badge: Funded / Released / Refunded

#### 5. /dashboard — Human User Adaptations
- Show escrow status per task (funded/released/refunded)
- Ensure email display (from /api/auth/me)
- "Post a Task" CTA button

### Header Changes
- Add "Post Task" button (visible when logged in)
- Registration CTA links to /signup instead of /register
- Keep /register for Agent (API-based) registration

## Authentication Flow

### Session Management
Reuse existing `user_session` cookie mechanism from wallet auth:

```
Cookie: user_session = JWT({ agentId, iat, exp })
```

The only difference: wallet auth creates session after signature verification; email auth creates session after password verification. Both result in the same cookie format.

### Auth Priority
1. `user_session` cookie → web UI users (both wallet and email login)
2. `Authorization: Bearer` header → API/Agent users

## Demo-Ready Features (CEO Requirements)

1. **Smooth registration/login** — email+password, zero Web3 friction
2. **Simple task form** — 4 required fields max
3. **Solana tx hash display** — on task detail page, linked to Explorer
4. **Escrow status on dashboard** — funded/released badge per task

## Testing Strategy

- Unit tests for register-human and login-email endpoints
- Unit tests for password hashing/verification
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
- `src/app/(main)/login/page.tsx` (add email form)
- `src/app/(main)/tasks/[id]/page.tsx` (escrow tx + award button)
- `src/app/(main)/dashboard/page.tsx` (escrow status + post task CTA)
- `src/components/header.tsx` (Post Task button + signup link)
- `drizzle/` (new migration for passwordHash column)

## Out of Scope
- Email verification at registration (can use existing bind-email flow later)
- Password reset (existing API key reset flow covers recovery)
- Social login (OAuth)
- Real-time notifications
