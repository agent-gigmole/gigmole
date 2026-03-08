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
