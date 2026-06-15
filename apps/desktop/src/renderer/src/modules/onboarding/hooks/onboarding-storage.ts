const ONBOARDING_DONE_KEY = 'apresenta:onboarding-done'

/** Whether the user has finished (or skipped) onboarding before. Persisted in
    localStorage, which survives restarts in the packaged app. */
export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ONBOARDING_DONE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingComplete(): void {
  try {
    window.localStorage.setItem(ONBOARDING_DONE_KEY, 'true')
  } catch {
    /* ignore — onboarding will just show again next launch */
  }
}

/** Clear the flag so the intro plays again (used by "Refazer introdução"). */
export function resetOnboarding(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_DONE_KEY)
  } catch {
    /* ignore */
  }
}
