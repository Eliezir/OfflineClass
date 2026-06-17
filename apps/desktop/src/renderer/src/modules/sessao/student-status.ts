import type { SessionLobbyStudent, StudentLiveStatus } from './types'

/** A student is idle if we haven't heard from them in this long (ms). */
const IDLE_AFTER_MS = 90_000

/** Derive the live status of a student from their presence/submission state. */
export function deriveStudentStatus(student: SessionLobbyStudent, now: number): StudentLiveStatus {
  if (student.submittedAt !== null) return 'submitted'
  if (now - student.lastSeenAt > IDLE_AFTER_MS) return 'idle'
  return 'active'
}

/** First-letter initials for the avatar bubble (max two). */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
