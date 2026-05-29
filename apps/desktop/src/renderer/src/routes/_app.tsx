import { useEffect, useState } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@renderer/shared/layouts/sidebar'

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

export const Route = createFileRoute('/_app')({
  component: AppLayout
})

const THEME_STORAGE_KEY = 'offlineclass:theme'

function readSavedTheme(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark') return true
    if (saved === 'light') return false
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function AppLayout(): React.JSX.Element {
  const [isDark, setIsDark] = useState<boolean>(readSavedTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [isDark])

  // ⌘⇧D / Ctrl+Shift+D toggles theme
  useEffect(() => {
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
  }, [])

  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar />

      <main className="flex flex-1 overflow-hidden py-3 pr-3 pl-3" style={dragRegion}>
        <div
          className="flex flex-1 overflow-hidden rounded-[14px] border border-border/40 bg-background"
          style={noDragRegion}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
