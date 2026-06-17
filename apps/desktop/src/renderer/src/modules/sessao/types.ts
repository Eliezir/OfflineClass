import type { SessionDetail, SessionLobbyStudent, SessionStatus } from '@offlineclass/shared'

// The session screen is typed against the same shapes the backend IPC will
// return (`SessionDetail` + `SessionLobbyStudent`), so swapping mock data for
// real queries later is a drop-in. Re-exported here for ergonomic imports.
export type { SessionDetail, SessionLobbyStudent, SessionStatus }

/** Lifecycle phase the screen renders. `none` = no active session yet. */
export type SessionPhase = 'none' | SessionStatus

/** Derived per-student state used by the live roster / dashboard. */
export type StudentLiveStatus = 'submitted' | 'active' | 'idle'
