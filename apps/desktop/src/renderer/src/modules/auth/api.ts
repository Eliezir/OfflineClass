import type {
  AvatarConfig,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  Teacher,
  UpdateProfileInput
} from '@offlineclass/shared'

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

/* TODO(backend): the offline-first backend doesn't expose profile mutations yet
   (the auth bridge only has me/login/register/logout). These resolve locally so
   the profile UI is complete; swap the bodies for `window.api.auth.*` calls once
   the backend refactor lands — the queries/components stay unchanged. */

export async function updateProfile(input: UpdateProfileInput): Promise<Teacher> {
  const current = await getMe()
  if (!current) throw new Error('Sessão expirada. Entre novamente.')
  return { ...current, ...input }
}

/* The avatar, unlike name/email, is persisted in the backend: the LAN server
   reads it from the DB to show students whose room they joined. */
export function updateAvatar(avatar: AvatarConfig | null): Promise<Teacher> {
  return window.api.auth.updateAvatar(avatar)
}

export async function changePassword(_input: ChangePasswordInput): Promise<null> {
  const current = await getMe()
  if (!current) throw new Error('Sessão expirada. Entre novamente.')
  return null
}
