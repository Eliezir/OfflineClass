import { useTheme } from './use-theme'
import { ThemeContext } from './theme-context'

/** Owns the single theme instance for the app shell so any screen (the header
    toggle, Settings, …) reads and writes the same state. `useTheme` has side
    effects + persistence, so it must be instantiated once — not per consumer. */
export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const theme = useTheme({ keyboardShortcut: true })
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
