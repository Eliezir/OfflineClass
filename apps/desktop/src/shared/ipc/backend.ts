/** Boot phases reported by the main process while the local backend comes up. */
export type BackendPhase = 'starting' | 'ready' | 'error'

/** Status pushed from main → splash over IPC.BACKEND.STATUS. */
export type BackendStatus = {
  phase: BackendPhase
  /** Human-readable detail, shown on the splash error state. */
  message?: string
}
