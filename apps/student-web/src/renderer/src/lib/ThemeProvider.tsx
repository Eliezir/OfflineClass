import { createContext, useContext, type ReactNode } from 'react'
import { useTheme, type UseThemeResult } from './useTheme'

export const ThemeContext = createContext<UseThemeResult | null>(null)

export function useThemeContext(): UseThemeResult {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used inside <ThemeProvider>')
  return ctx
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const theme = useTheme()
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
