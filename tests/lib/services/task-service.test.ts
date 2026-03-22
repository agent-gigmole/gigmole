import { describe, it, expect } from 'vitest'
import { isValidTransition, isValidAdminTransition, TaskStatus } from '@/lib/services/task-service'

describe('Task State Machine', () => {
  it('OPEN → AWARDED is valid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.AWARDED)).toBe(true)
  })
  it('OPEN → CANCELLED is valid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.CANCELLED)).toBe(true)
  })
  it('OPEN → IN_PROGRESS is valid (skip award)', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.IN_PROGRESS)).toBe(true)
  })
  it('AWARDED → IN_PROGRESS is valid', () => {
    expect(isValidTransition(TaskStatus.AWARDED, TaskStatus.IN_PROGRESS)).toBe(true)
  })
  it('IN_PROGRESS → SUBMITTED is valid', () => {
    expect(isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED)).toBe(true)
  })
  it('SUBMITTED → RELEASING is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.RELEASING)).toBe(true)
  })
  it('SUBMITTED → ACCEPTED is NOT valid (must go through RELEASING)', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.ACCEPTED)).toBe(false)
  })
  it('RELEASING → ACCEPTED is valid (escrow release succeeded)', () => {
    expect(isValidTransition(TaskStatus.RELEASING, TaskStatus.ACCEPTED)).toBe(true)
  })
  it('RELEASING → SUBMITTED is valid (escrow release failed, rollback)', () => {
    expect(isValidTransition(TaskStatus.RELEASING, TaskStatus.SUBMITTED)).toBe(true)
  })
  it('SUBMITTED → REJECTED is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.REJECTED)).toBe(true)
  })
  it('SUBMITTED → DISPUTED is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.DISPUTED)).toBe(true)
  })
  it('REJECTED → SUBMITTED is valid (resubmit)', () => {
    expect(isValidTransition(TaskStatus.REJECTED, TaskStatus.SUBMITTED)).toBe(true)
  })
  it('REJECTED → DISPUTED is valid', () => {
    expect(isValidTransition(TaskStatus.REJECTED, TaskStatus.DISPUTED)).toBe(true)
  })
  it('DISPUTED → RESOLVED is valid', () => {
    expect(isValidTransition(TaskStatus.DISPUTED, TaskStatus.RESOLVED)).toBe(true)
  })
  it('OPEN → ACCEPTED is invalid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.ACCEPTED)).toBe(false)
  })
  it('ACCEPTED → anything is invalid (terminal)', () => {
    expect(isValidTransition(TaskStatus.ACCEPTED, TaskStatus.OPEN)).toBe(false)
    expect(isValidTransition(TaskStatus.ACCEPTED, TaskStatus.CANCELLED)).toBe(false)
  })
  it('CANCELLED → anything is invalid (terminal)', () => {
    expect(isValidTransition(TaskStatus.CANCELLED, TaskStatus.OPEN)).toBe(false)
  })
})

describe('isValidAdminTransition', () => {
  it('allows OPEN → CANCELLED', () => {
    expect(isValidAdminTransition(TaskStatus.OPEN, TaskStatus.CANCELLED)).toBe(true)
  })
  it('allows AWARDED → CANCELLED', () => {
    expect(isValidAdminTransition(TaskStatus.AWARDED, TaskStatus.CANCELLED)).toBe(true)
  })
  it('allows IN_PROGRESS → CANCELLED', () => {
    expect(isValidAdminTransition(TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED)).toBe(true)
  })
  it('allows SUBMITTED → CANCELLED', () => {
    expect(isValidAdminTransition(TaskStatus.SUBMITTED, TaskStatus.CANCELLED)).toBe(true)
  })
  it('allows RELEASING → SUBMITTED (stuck rollback)', () => {
    expect(isValidAdminTransition(TaskStatus.RELEASING, TaskStatus.SUBMITTED)).toBe(true)
  })
  it('allows REJECTED → RESOLVED', () => {
    expect(isValidAdminTransition(TaskStatus.REJECTED, TaskStatus.RESOLVED)).toBe(true)
  })
  it('allows DISPUTED → RESOLVED', () => {
    expect(isValidAdminTransition(TaskStatus.DISPUTED, TaskStatus.RESOLVED)).toBe(true)
  })
  it('rejects OPEN → ACCEPTED (not in admin whitelist)', () => {
    expect(isValidAdminTransition(TaskStatus.OPEN, TaskStatus.ACCEPTED)).toBe(false)
  })
  it('rejects ACCEPTED → anything (terminal, no admin transitions)', () => {
    expect(isValidAdminTransition(TaskStatus.ACCEPTED, TaskStatus.CANCELLED)).toBe(false)
  })
  it('rejects CANCELLED → anything (terminal)', () => {
    expect(isValidAdminTransition(TaskStatus.CANCELLED, TaskStatus.OPEN)).toBe(false)
  })
  it('rejects RELEASING → ACCEPTED (admin cannot force-accept)', () => {
    expect(isValidAdminTransition(TaskStatus.RELEASING, TaskStatus.ACCEPTED)).toBe(false)
  })
})
