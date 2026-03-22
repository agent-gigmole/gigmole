export { TaskStatus } from '@/lib/db/schema'
import { TaskStatus } from '@/lib/db/schema'

type Status = (typeof TaskStatus)[keyof typeof TaskStatus]

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  [TaskStatus.OPEN]: [TaskStatus.AWARDED, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.AWARDED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.SUBMITTED],
  [TaskStatus.SUBMITTED]: [TaskStatus.RELEASING, TaskStatus.REJECTED, TaskStatus.DISPUTED],
  [TaskStatus.RELEASING]: [TaskStatus.ACCEPTED, TaskStatus.SUBMITTED],  // P0-2: releasing → accepted (成功) 或 → submitted (链上失败回滚)
  [TaskStatus.ACCEPTED]: [],
  [TaskStatus.REJECTED]: [TaskStatus.SUBMITTED, TaskStatus.DISPUTED],
  [TaskStatus.DISPUTED]: [TaskStatus.RESOLVED],
  [TaskStatus.RESOLVED]: [],
  [TaskStatus.CANCELLED]: [],
}

// P0-4: Admin 允许的特定状态转换（不能任意改状态）
export const ADMIN_ALLOWED_TRANSITIONS: Record<string, Status[]> = {
  [TaskStatus.OPEN]: [TaskStatus.CANCELLED],
  [TaskStatus.AWARDED]: [TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.CANCELLED],
  [TaskStatus.SUBMITTED]: [TaskStatus.CANCELLED],
  [TaskStatus.RELEASING]: [TaskStatus.SUBMITTED],  // 链上卡住时 admin 可回滚
  [TaskStatus.REJECTED]: [TaskStatus.RESOLVED],
  [TaskStatus.DISPUTED]: [TaskStatus.RESOLVED],
}

export function isValidAdminTransition(from: Status, to: Status): boolean {
  return ADMIN_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function isValidTransition(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
