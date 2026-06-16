import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'offlineclass:theme'

/** Resolve the initial theme: saved preference wins, otherwise fall back to the
    OS setting. Kept in sync with the inline bootstrap in `public/splash.html`. */
function readSavedTheme(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark') return true
    if (saved === 'light') return false
  } catch {
    /* localStorage unavailable; fall back to OS preference */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

type UseThemeOptions = {
  /** Bind ⌘⇧D / Ctrl+Shift+D to toggle the theme. Off by default. */
  keyboardShortcut?: boolean
}

export type UseThemeResult = {
  isDark: boolean
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>
  toggleTheme: () => void
}

/** Owns the `.dark` class on `<html>` and persists the choice to localStorage.
    The splash window reads the same key and reacts to the `storage` event. */
export function useTheme({ keyboardShortcut = false }: UseThemeOptions = {}): UseThemeResult {
  const [isDark, setIsDark] = useState<boolean>(readSavedTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* ignore — falls back to OS preference next launch */
    }
  }, [isDark])

  useEffect(() => {
    if (!keyboardShortcut) return
    const handler = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key.toLowerCase() === 'd' && e.shiftKey && !e.altKey) {
        e.preventDefault()
        setIsDark((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboardShortcut])

  return { isDark, setIsDark, toggleTheme: () => setIsDark((v) => !v) }
}
