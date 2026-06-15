import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  useNotificationSettings,
  type ToastPosition
} from '@renderer/modules/settings/hooks/use-notification-settings'
import { TOAST_TONES } from '@renderer/modules/settings/toast-tones'
import { useThemeContext } from '@renderer/shared/hooks/theme-context'
import { cn } from '@renderer/shared/utils'

type Position = NonNullable<ToasterProps['position']>

const toneIcons = Object.fromEntries(
  TOAST_TONES.map((t) => {
    const Icon = t.icon
    return [
      t.id,
      <Icon key={t.id} className="size-[18px]" style={{ color: t.accent }} strokeWidth={2.25} />
    ]
  })
) as ToasterProps['icons']

/** Sonner has no vertical-centre position, so map our two to the matching top
    corner and let `apresenta-toaster--vcenter` (main.css) centre the container. */
function toSonnerPosition(position: ToastPosition): { position: Position; vcenter: boolean } {
  switch (position) {
    case 'center-left':
      return { position: 'top-left', vcenter: true }
    case 'center-right':
      return { position: 'top-right', vcenter: true }
    default:
      return { position, vcenter: false }
  }
}

/** The single app-wide toast outlet. Fire toasts via the `notify` helper. */
export function AppToaster(): React.JSX.Element {
  const { isDark } = useThemeContext()
  const { position } = useNotificationSettings()
  const { position: sonnerPosition, vcenter } = toSonnerPosition(position)

  return (
    <Sonner
      theme={isDark ? 'dark' : 'light'}
      position={sonnerPosition}
      closeButton
      gap={10}
      offset={16}
      className={cn('toaster group', vcenter && 'apresenta-toaster--vcenter')}
      icons={toneIcons}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius-md)'
        } as React.CSSProperties
      }
    />
  )
}
