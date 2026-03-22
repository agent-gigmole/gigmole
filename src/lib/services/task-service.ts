export { TaskStatus } from '@/lib/db/schema'
import { TaskStatus } from '@/lib/db/schema'

type Status = (typeof TaskStatus)[keyof typeof TaskStatus]

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  [TaskStatus.OPEN]: [TaskStatus.AWARDED, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.AWARDED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.SUBMITTED],
  [TaskStatus.SUBMITTED]: [TaskStatus.ACCEPTED, TaskStatus.REJECTED, TaskStatus.DISPUTED],
  [TaskStatus.ACCEPTED]: [],
  [TaskStatus.REJECTED]: [TaskStatus.SUBMITTED, TaskStatus.DISPUTED],
  [TaskStatus.DISPUTED]: [TaskStatus.RESOLVED],
  [TaskStatus.RESOLVED]: [],
  [TaskStatus.CANCELLED]: [],
}

export function isValidTransition(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
