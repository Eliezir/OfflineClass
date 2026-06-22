import { Outlet } from 'react-router-dom'
import { WindowControls } from './WindowControls'
import { AppToaster } from './AppToaster'
import { isElectron } from '@/lib/platform'

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties

/** App shell: frameless title-bar (drag region + window controls) +
    content area + toast outlet. */
export function AppLayout(): React.JSX.Element {
  return (
    <div className="bg-background flex h-screen flex-col">
      {/* ── Custom title bar (Windows/Linux frameless) ───────────────── */}
      {isElectron() && (
        <div
          className="flex h-11 shrink-0 items-center justify-end gap-1 px-3"
          style={dragRegion}
        >
          <WindowControls />
        </div>
      )}

      {/* ── Page content ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>

      {/* ── Toast notifications ───────────────────────────────────────── */}
      <AppToaster />
    </div>
  )
}
