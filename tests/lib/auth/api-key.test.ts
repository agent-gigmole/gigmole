import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, verifyApiKey } from '@/lib/auth/api-key'

describe('API Key utilities', () => {
  it('generateApiKey returns a non-empty string starting with agl_', () => {
    const key = generateApiKey()
    expect(key).toBeTruthy()
    expect(key.startsWith('agl_')).toBe(true)
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
