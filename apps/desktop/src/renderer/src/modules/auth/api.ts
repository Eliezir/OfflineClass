import type { LoginInput, RegisterInput, Teacher } from '@offlineclass/shared'

/* Teacher auth over the domain IPC bridge (window.api.auth → main process).
   The session token is persisted in the main process (userData), so login is
   sticky across restarts — `getMe` resolves it. */

export function getMe(): Promise<Teacher | null> {
  return window.api.auth.me()
}

export function login(input: LoginInput): Promise<Teacher> {
  return window.api.auth.login(input)
}

export function register(input: RegisterInput): Promise<Teacher> {
  return window.api.auth.register(input)
}

export function logout(): Promise<null> {
  return window.api.auth.logout()
}
