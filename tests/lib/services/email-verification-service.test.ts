import { describe, it, expect } from 'vitest'
import {
  generateVerificationCode,
  hashCode,
  verifyCode,
  generateBindToken,
  isValidEmail,
  CODE_EXPIRY_MS,
  BIND_TOKEN_EXPIRY_MS,
  MAX_SEND_ATTEMPTS,
  MAX_VERIFY_ATTEMPTS,
} from '@/lib/services/email-verification-service'

describe('Email Verification Service', () => {
  describe('generateVerificationCode', () => {
    it('generates a 6-digit string', () => {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{6}$/)
      expect(code.length).toBe(6)
    })

    it('generates different codes', () => {
      const codes = new Set(
        Array.from({ length: 10 }, () => generateVerificationCode())
      )
      // At least some should be different (statistically guaranteed)
      expect(codes.size).toBeGreaterThan(1)
    })
  })

  describe('hashCode / verifyCode', () => {
    it('verifies a correct code', () => {
      const code = '123456'
      const hash = hashCode(code)
      expect(verifyCode(code, hash)).toBe(true)
    })

    it('rejects an incorrect code', () => {
      const hash = hashCode('123456')
      expect(verifyCode('654321', hash)).toBe(false)
    })

    it('rejects invalid hash format', () => {
      expect(verifyCode('123456', 'not-a-hex-hash')).toBe(false)
    })

    it('hash is deterministic', () => {
      const hash1 = hashCode('123456')
      const hash2 = hashCode('123456')
      expect(hash1).toBe(hash2)
    })
  })

  describe('generateBindToken', () => {
    it('generates a 64-char hex string', () => {
      const token = generateBindToken()
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it('generates unique tokens', () => {
      const token1 = generateBindToken()
      const token2 = generateBindToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co')).toBe(true)
      expect(isValidEmail('a@b.c')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @domain.com')).toBe(false)
    })

    it('rejects emails over 255 chars', () => {
      const longEmail = 'a'.repeat(250) + '@b.com'
      expect(isValidEmail(longEmail)).toBe(false)
    })
  })

  describe('constants', () => {
    it('CODE_EXPIRY_MS is 5 minutes', () => {
      expect(CODE_EXPIRY_MS).toBe(5 * 60 * 1000)
    })

    it('BIND_TOKEN_EXPIRY_MS is 10 minutes', () => {
      expect(BIND_TOKEN_EXPIRY_MS).toBe(10 * 60 * 1000)
    })

    it('MAX_SEND_ATTEMPTS is 3', () => {
      expect(MAX_SEND_ATTEMPTS).toBe(3)
    })

    it('MAX_VERIFY_ATTEMPTS is 5', () => {
      expect(MAX_VERIFY_ATTEMPTS).toBe(5)
    })
  })
})
