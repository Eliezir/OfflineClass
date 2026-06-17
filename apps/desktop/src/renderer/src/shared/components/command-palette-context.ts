import { createContext, useContext } from 'react'

export type CommandPaletteContextValue = {
  open: () => void
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

/** Opens the ⌘K command palette from anywhere in the app shell. */
export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  return ctx
}
