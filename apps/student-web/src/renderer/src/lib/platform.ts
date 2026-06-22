/** Returns true when we're running inside Electron (not a plain browser).
    Used to decide whether to show frameless window controls. */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.api
}
