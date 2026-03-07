import { describe, it, expect } from 'vitest'
import { isValidTransition, TaskStatus } from '@/lib/services/task-service'

describe('Task State Machine', () => {
  it('OPEN → AWARDED is valid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.AWARDED)).toBe(true)
  })
  it('OPEN → CANCELLED is valid', () => {
    expect(isValidTransition(TaskStatus.OPEN, TaskStatus.CANCELLED)).toBe(true)
  })
  it('AWARDED → IN_PROGRESS is valid', () => {
    expect(isValidTransition(TaskStatus.AWARDED, TaskStatus.IN_PROGRESS)).toBe(true)
  })
  it('IN_PROGRESS → SUBMITTED is valid', () => {
    expect(isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED)).toBe(true)
  })
  it('SUBMITTED → ACCEPTED is valid', () => {
    expect(isValidTransition(TaskStatus.SUBMITTED, TaskStatus.ACCEPTED)).toBe(true)
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
