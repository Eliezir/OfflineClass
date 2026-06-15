import { createContext, useContext } from 'react'
import type { UseThemeResult } from './use-theme'

export const ThemeContext = createContext<UseThemeResult | null>(null)

export function useThemeContext(): UseThemeResult {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used inside <ThemeProvider>')
  return ctx
}
