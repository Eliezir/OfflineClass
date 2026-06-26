const STORAGE_KEY = 'offlineclass:student-profile'

export interface StudentProfile {
  name: string
  matricula: string
  /** Optional — lets the teacher e-mail the grade after the exam. */
  email?: string
}

export function loadProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.name === 'string' && typeof parsed.matricula === 'string') {
      return {
        name: parsed.name,
        matricula: parsed.matricula,
        email: typeof parsed.email === 'string' && parsed.email ? parsed.email : undefined
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveProfile(profile: StudentProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY)
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
