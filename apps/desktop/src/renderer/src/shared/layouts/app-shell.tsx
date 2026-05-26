import { Outlet } from '@tanstack/react-router'
import { AppChrome } from './app-chrome'

export function AppShell(): React.JSX.Element {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppChrome />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
