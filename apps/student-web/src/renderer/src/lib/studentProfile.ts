import { AvatarConfig } from '@offlineclass/shared'

// Profiles are keyed by matrícula so a shared classroom PC can remember many
// students. `:last` points at the most recently used one (for prefill on open).
const key = (matricula: string): string => `offlineclass:student:${matricula.trim()}`
const LAST_KEY = 'offlineclass:student:last'
const LEGACY_KEY = 'offlineclass:student-profile'

export interface StudentProfile {
  name: string
  matricula: string
  email: string | null
  avatar: AvatarConfig | null
}

function parseAvatar(raw: unknown): AvatarConfig | null {
  const parsed = AvatarConfig.safeParse(raw)
  return parsed.success ? parsed.data : null
}

/** Load a saved profile by matrícula (migrating the legacy single-profile key). */
export function loadProfile(matricula: string): StudentProfile | null {
  const m = matricula.trim()
  if (!m) return null
  try {
    const raw = localStorage.getItem(key(m))
    if (!raw) return migrateLegacy(m)
    const p = JSON.parse(raw) as Record<string, unknown>
    if (p && typeof p.name === 'string') {
      return {
        name: p.name,
        matricula: m,
        email: typeof p.email === 'string' ? p.email : null,
        avatar: parseAvatar(p.avatar)
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveProfile(profile: StudentProfile): void {
  const m = profile.matricula.trim()
  if (!m) return
  try {
    localStorage.setItem(
      key(m),
      JSON.stringify({ name: profile.name, email: profile.email, avatar: profile.avatar })
    )
    localStorage.setItem(LAST_KEY, m)
  } catch {
    /* ignore quota errors */
  }
}

/** Matrícula of the most recently used profile, to prefill the join form. */
export function getLastMatricula(): string | null {
  try {
    return localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

export function clearProfile(matricula: string): void {
  const m = matricula.trim()
  try {
    localStorage.removeItem(key(m))
    if (getLastMatricula() === m) localStorage.removeItem(LAST_KEY)
  } catch {
    /* ignore */
  }
}

/** One-time bridge from the old single-profile key to the per-matrícula store. */
function migrateLegacy(matricula: string): StudentProfile | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Record<string, unknown>
    if (p && typeof p.name === 'string' && typeof p.matricula === 'string' && p.matricula.trim() === matricula) {
      const profile: StudentProfile = { name: p.name, matricula, email: null, avatar: null }
      saveProfile(profile)
      return profile
    }
    return null
  } catch {
    return null
  }
}

/** Extract initials from a name (e.g. "João Silva" → "JS"). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}
