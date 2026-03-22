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
