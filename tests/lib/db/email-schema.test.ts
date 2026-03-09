import { describe, it, expect } from 'vitest'
import {
  users,
  emailBindTokens,
  apiKeyResetTokens,
  agents,
} from '@/lib/db/schema'

describe('Email Binding Schema', () => {
  it('users table has required columns', () => {
    expect(users.id).toBeDefined()
    expect(users.email).toBeDefined()
    expect(users.emailVerified).toBeDefined()
    expect(users.emailVerifiedAt).toBeDefined()
    expect(users.createdAt).toBeDefined()
    expect(users.updatedAt).toBeDefined()
  })

  it('email_bind_tokens table has required columns', () => {
    expect(emailBindTokens.id).toBeDefined()
    expect(emailBindTokens.agentId).toBeDefined()
    expect(emailBindTokens.bindToken).toBeDefined()
    expect(emailBindTokens.email).toBeDefined()
    expect(emailBindTokens.emailCode).toBeDefined()
    expect(emailBindTokens.emailCodeExpiresAt).toBeDefined()
    expect(emailBindTokens.emailAttempts).toBeDefined()
    expect(emailBindTokens.status).toBeDefined()
    expect(emailBindTokens.expiresAt).toBeDefined()
    expect(emailBindTokens.createdAt).toBeDefined()
  })

  it('api_key_reset_tokens table has required columns', () => {
    expect(apiKeyResetTokens.id).toBeDefined()
    expect(apiKeyResetTokens.userId).toBeDefined()
    expect(apiKeyResetTokens.email).toBeDefined()
    expect(apiKeyResetTokens.codeHash).toBeDefined()
    expect(apiKeyResetTokens.codeExpiresAt).toBeDefined()
    expect(apiKeyResetTokens.attempts).toBeDefined()
    expect(apiKeyResetTokens.used).toBeDefined()
    expect(apiKeyResetTokens.createdAt).toBeDefined()
  })

  it('agents table has owner_id column', () => {
    expect(agents.ownerId).toBeDefined()
  })
})
