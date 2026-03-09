# Admin Dashboard -- Patterns & Gotchas

## Architecture

### Route Group Isolation {#route-group-isolation}

Next.js nested layouts **always nest inside parent layouts** -- you cannot "replace" a parent layout. To give admin pages a completely different layout (no public Header/Footer), use **route groups**:

```
src/app/
  (main)/          ← public pages (inherits public layout with Header/Footer)
    page.tsx
    market/
    docs/
    ...
  (main)/layout.tsx  ← public layout with Header + Footer
  admin/           ← admin pages (separate layout, no Header/Footer)
    layout.tsx     ← admin layout with sidebar nav
    page.tsx       ← dashboard
    login/
    agents/
    tasks/
    forum/
    finance/
    config/
  layout.tsx       ← root layout (html + body only)
```

### Auth: Stateless HMAC Tokens {#hmac-tokens}

- `createSessionToken(password)`: HMAC-SHA256 signs `admin:{timestamp}` with ADMIN_SESSION_SECRET
- `verifySessionToken(token)`: verifies signature + checks 24h TTL
- Token stored in `admin_session` cookie (httpOnly, secure, sameSite=strict)
- **Logout only clears the browser cookie** -- token remains valid server-side until TTL expires
- This is acceptable for admin-only use; for higher security, use a server-side session store

### Token Expiry {#token-expiry}

- 24h server-side validation added in `verifySessionToken`
- Extracts timestamp from payload, rejects if > 24 hours old
- No database roundtrip needed (stateless)

## API Endpoints (13 routes)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/admin/login | Authenticate with password |
| POST | /api/admin/logout | Clear session cookie |
| GET | /api/admin/stats | KPI numbers (agents, tasks, bids, volume) |
| GET | /api/admin/finance | Financial breakdown by task status |
| GET | /api/admin/agents | List agents (search, pagination) |
| PATCH | /api/admin/agents/[id] | Ban/unban agent |
| GET | /api/admin/tasks | List tasks (status filter, pagination) |
| PATCH | /api/admin/tasks/[id] | Force task status change |
| GET | /api/admin/forum | List forum proposals |
| PATCH | /api/admin/forum/[id] | Close forum proposal |
| GET | /api/admin/config | Get platform config |
| PATCH | /api/admin/config | Update platform config |

## Gotchas

### Vercel env newline {#vercel-env-newline}

```bash
# WRONG -- adds trailing newline to the value
echo "my-secret" | vercel env add MY_VAR production

# CORRECT -- no trailing newline
printf "my-secret" | vercel env add MY_VAR production
```

This caused auth failures because the ADMIN_PASSWORD had a trailing `\n`.

### USDC Amount Conversions {#usdc-conversions}

- Database stores USDC in **lamports** (integer, 6 decimals): 1 USDC = 1,000,000 lamports
- Display: `value / 1_000_000` with `.toFixed(2)` or `.toFixed(6)`
- Save: `parseFloat(input) * 1_000_000`
- Transaction fee stored in **basis points** (bps): 500 bps = 5%
- Display: `bps / 100` as percentage
- Save: `parseFloat(percent) * 100` as bps

### Admin Password {#admin-password}

- Password: `aglabor-admin-2026`
- Stored in Vercel env as `ADMIN_PASSWORD`
- Admin URL: https://aglabor.vercel.app/admin
