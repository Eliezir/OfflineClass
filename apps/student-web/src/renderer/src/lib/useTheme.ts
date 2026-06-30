import { useCallback, useEffect, useState } from 'react'

/** Display + accessibility preferences, persisted in localStorage and applied
    to <html> as classes / CSS variables. Owned by the ThemeProvider. */

const KEY = {
  theme: 'offlineclass:theme',
  fontScale: 'offlineclass:font-scale',
  contrast: 'offlineclass:contrast',
  reduceMotion: 'offlineclass:reduce-motion',
  legible: 'offlineclass:legible-font'
} as const

export type ThemeMode = 'light' | 'dark' | 'system'

/** Multipliers behind the A−/A/A+/A++ control. */
export const FONT_SCALES = [0.9, 1, 1.15, 1.3] as const
export type FontScale = (typeof FONT_SCALES)[number]

function readString(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function readBool(key: string): boolean {
  return readString(key, 'false') === 'true'
}

function readTheme(): ThemeMode {
  const v = readString(KEY.theme, 'system')
  return v === 'light' || v === 'dark' ? v : 'system'
}

function readFontScale(): number {
  const n = Number(readString(KEY.fontScale, '1'))
  return FONT_SCALES.includes(n as FontScale) ? n : 1
}

function persist(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export interface UseThemeResult {
  theme: ThemeMode
  /** Resolved appearance after applying the system preference. */
  isDark: boolean
  fontScale: number
  contrast: boolean
  reduceMotion: boolean
  legibleFont: boolean
  setTheme: (theme: ThemeMode) => void
  setFontScale: (scale: number) => void
  setContrast: (on: boolean) => void
  setReduceMotion: (on: boolean) => void
  setLegibleFont: (on: boolean) => void
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme)
  const [fontScale, setFontScaleState] = useState<number>(readFontScale)
  const [contrast, setContrastState] = useState<boolean>(() => readBool(KEY.contrast))
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => readBool(KEY.reduceMotion))
  const [legibleFont, setLegibleFontState] = useState<boolean>(() => readBool(KEY.legible))

  const [systemDark, setSystemDark] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Track the OS theme so 'system' stays live.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent): void => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  // Apply everything to <html>.
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', isDark)
    el.classList.toggle('contrast', contrast)
    el.classList.toggle('reduce-motion', reduceMotion)
    el.classList.toggle('legible', legibleFont)
    el.style.setProperty('--font-scale', String(fontScale))
  }, [isDark, contrast, reduceMotion, legibleFont, fontScale])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    persist(KEY.theme, next)
  }, [])

  const setFontScale = useCallback((scale: number) => {
    setFontScaleState(scale)
    persist(KEY.fontScale, String(scale))
  }, [])

  const setContrast = useCallback((on: boolean) => {
    setContrastState(on)
    persist(KEY.contrast, String(on))
  }, [])

  const setReduceMotion = useCallback((on: boolean) => {
    setReduceMotionState(on)
    persist(KEY.reduceMotion, String(on))
  }, [])

  const setLegibleFont = useCallback((on: boolean) => {
    setLegibleFontState(on)
    persist(KEY.legible, String(on))
  }, [])

  return {
    theme,
    isDark,
    fontScale,
    contrast,
    reduceMotion,
    legibleFont,
    setTheme,
    setFontScale,
    setContrast,
    setReduceMotion,
    setLegibleFont
  }
}
