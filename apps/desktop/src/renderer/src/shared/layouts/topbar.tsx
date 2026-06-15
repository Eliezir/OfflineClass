import { NotificationsMenu } from '@renderer/shared/layouts/notifications-menu'
import { WindowControls } from '@renderer/shared/layouts/window-controls'
import { usesCustomWindowChrome } from '@renderer/shared/utils'

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

/** Full-width draggable topbar for frameless Windows/Linux. The empty left
    side is the drag handle; the right cluster holds the notifications menu and
    the min/max/close controls. Renders nothing on macOS (native traffic lights
    + sidebar notifications) and web. */
export function TopBar(): React.JSX.Element | null {
  if (!usesCustomWindowChrome()) return null

  return (
    <header
      className="flex h-10 shrink-0 items-center justify-end gap-1 pr-2 pl-3"
      style={dragRegion}
    >
      <div className="flex items-center gap-1" style={noDragRegion}>
        <NotificationsMenu side="bottom" align="end" sideOffset={8} alignOffset={0} />
        <WindowControls />
      </div>
    </header>
  )
}
