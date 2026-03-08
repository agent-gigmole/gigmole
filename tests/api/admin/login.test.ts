import { describe, it, expect, vi } from 'vitest'

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
    const req = new NextRequest('http://localhost/api/admin/logout', { method: 'POST' })
    const res = await logoutPOST(req)
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('admin_session')
    expect(setCookie).toContain('Max-Age=0')
  })
})
