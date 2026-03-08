import { describe, it, expect, vi } from 'vitest'

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

  it('verifySessionToken validates a created token', () => {
    const token = createSessionToken()
    expect(verifySessionToken(token)).toBe(true)
  })

  it('verifySessionToken rejects a tampered token', () => {
    expect(verifySessionToken('invalid.token')).toBe(false)
  })

  it('authenticateAdmin returns 401 when no cookie', async () => {
    const req = new NextRequest('http://localhost/api/admin/stats')
    const result = await authenticateAdmin(req)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(401)
  })
})
