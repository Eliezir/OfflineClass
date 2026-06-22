import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'

const toneIcons: ToasterProps['icons'] = {
  success: <CircleCheck className="size-[18px]" style={{ color: 'var(--success)' }} strokeWidth={2.25} />,
  info: <Info className="size-[18px]" style={{ color: 'var(--primary)' }} strokeWidth={2.25} />,
  warning: <TriangleAlert className="size-[18px]" style={{ color: 'var(--warning)' }} strokeWidth={2.25} />,
  error: <CircleX className="size-[18px]" style={{ color: 'var(--destructive)' }} strokeWidth={2.25} />
}

/** The single app-wide toast outlet. Fire toasts via the `notify` helper in lib/toast.ts. */
export function AppToaster(): React.JSX.Element {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      closeButton
      gap={10}
      offset={16}
      className="toaster group"
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
