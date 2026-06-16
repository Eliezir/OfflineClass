import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@renderer/shared/layouts/sidebar'
import { AppToaster } from '@renderer/shared/layouts/app-toaster'
import { ThemeProvider } from '@renderer/shared/hooks/theme-provider'

const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

export const Route = createFileRoute('/_app')({
  component: AppLayout
})

function AppLayout(): React.JSX.Element {
  // ThemeProvider owns the single theme instance + ⌘⇧D / Ctrl+Shift+D shortcut.
  // The shell is one surface (sidebar + content share the background); the only
  // divider is the sidebar's right border. Window chrome (notifications + the
  // frameless min/max/close controls) lives in the sidebar's top row; the page's
  // own header provides the window-drag region for the content side.
  return (
    <ThemeProvider>
      <div className="relative flex h-screen bg-background">
        <Sidebar />

        <div className="flex flex-1 overflow-hidden" style={noDragRegion}>
          <Outlet />
        </div>

        <AppToaster />
      </div>
    </ThemeProvider>
  )
}
