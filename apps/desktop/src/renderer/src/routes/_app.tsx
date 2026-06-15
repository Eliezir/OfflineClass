import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@renderer/shared/layouts/sidebar'
import { TopBar } from '@renderer/shared/layouts/topbar'
import { AppToaster } from '@renderer/shared/layouts/app-toaster'
import { ThemeProvider } from '@renderer/shared/hooks/theme-provider'

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

export const Route = createFileRoute('/_app')({
  component: AppLayout
})

function AppLayout(): React.JSX.Element {
  // ThemeProvider owns the single theme instance + ⌘⇧D / Ctrl+Shift+D shortcut.
  // TopBar is the frameless Windows/Linux chrome (drag + notifications +
  // controls) and renders nothing on macOS/web, leaving the layout untouched.
  return (
    <ThemeProvider>
      <div className="relative flex h-screen flex-col bg-canvas">
        <TopBar />

        <div className="flex flex-1 overflow-hidden">
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

        <AppToaster />
      </div>
    </ThemeProvider>
  )
}
