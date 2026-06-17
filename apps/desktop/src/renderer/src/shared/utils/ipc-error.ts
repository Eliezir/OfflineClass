/** Strips Electron's "Error invoking remote method '…': SomeError: " wrapper,
    leaving the human message the main process threw (already in PT-BR). */
export function ipcErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  const parts = raw.split(': ')
  return parts[parts.length - 1]?.trim() || fallback
}
