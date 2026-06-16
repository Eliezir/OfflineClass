export type Platform = NodeJS.Platform | 'web'

/** The host platform, or 'web' when running outside Electron (dev:web). */
export function getPlatform(): Platform {
  if (typeof window === 'undefined' || !window.electron) return 'web'
  return window.electron.process.platform as NodeJS.Platform
}

/** Windows/Linux are frameless and draw their own min/max/close chrome in the
    topbar; macOS uses native traffic lights and web has no window chrome. */
export function usesCustomWindowChrome(): boolean {
  const platform = getPlatform()
  return platform !== 'darwin' && platform !== 'web'
}
