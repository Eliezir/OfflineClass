import type { SessionDetail, SessionLobbyStudent, SessionStatus } from '@offlineclass/shared'

// The session screen is typed against the shapes the backend IPC returns
// (`SessionDetail` + `SessionLobbyStudent`). Re-exported here for ergonomic imports.
export type { SessionDetail, SessionLobbyStudent, SessionStatus }

/** Lifecycle phase the screen renders. `none` = no active session yet. */
export type SessionPhase = 'none' | SessionStatus

/** Derived per-student state used by the live roster / dashboard. */
export type StudentLiveStatus = 'submitted' | 'active' | 'idle'
