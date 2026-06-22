import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'offlineclass:theme'

function readSavedTheme(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark') return true
    if (saved === 'light') return false
  } catch {
    /* localStorage unavailable */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export type UseThemeResult = {
  isDark: boolean
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>
  toggleTheme: () => void
}

export function useTheme(): UseThemeResult {
  const [isDark, setIsDark] = useState<boolean>(readSavedTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [isDark])

  return { isDark, setIsDark, toggleTheme: () => setIsDark((v) => !v) }
}
