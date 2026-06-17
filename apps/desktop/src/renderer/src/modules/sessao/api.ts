import type { DiscoveryStatus, SessionCreateInput, SessionDetail } from '@offlineclass/shared'

/* Teacher session lifecycle over the domain IPC bridge (window.api.sessions →
   main process). The live roster/progress push (teacher WebSocket) lands in a
   separate branch; here we only do the CRUD + lifecycle transitions. */

export function getActiveSession(): Promise<SessionDetail | null> {
  return window.api.sessions.active()
}

export function createSession(input: SessionCreateInput): Promise<SessionDetail> {
  return window.api.sessions.create(input)
}

export function startSession(id: string): Promise<SessionDetail> {
  return window.api.sessions.start(id)
}

export function endSession(id: string): Promise<SessionDetail> {
  return window.api.sessions.end(id)
}

export function getDiscoveryStatus(): Promise<DiscoveryStatus> {
  return window.api.discovery.getStatus()
}
