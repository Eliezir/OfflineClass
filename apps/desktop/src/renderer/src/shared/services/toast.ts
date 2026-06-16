import { toast as sonner } from 'sonner'
import { getNotificationSettings } from '@renderer/modules/settings/hooks/use-notification-settings'
import type { ToastTone } from '@renderer/modules/settings/toast-tones'

export type NotifyOptions = {
  description?: string
  /** Reuse an id to replace an existing toast instead of stacking a new one. */
  id?: string | number
  /** Override the auto-dismiss duration (ms). Ignored when auto-dismiss is off. */
  duration?: number
}

function show(tone: ToastTone, message: string, options: NotifyOptions = {}): string | number {
  const settings = getNotificationSettings()

  if (settings.sound) playSound(tone)

  // Infinity keeps the toast until the user closes it via the close button.
  const duration = settings.autoDismiss ? (options.duration ?? settings.duration * 1000) : Infinity

  return sonner[tone](message, {
    id: options.id,
    description: options.description,
    duration
  })
}

/** Lazy import so the audio context is only created when sound is enabled. */
function playSound(tone: ToastTone): void {
  void import('./notification-sound').then((m) => m.playNotificationSound(tone))
}

/** Fire a toast that respects the user's notification preferences (position,
    duration, auto-dismiss, sound). Use this everywhere instead of importing
    `sonner` directly so tone styling and settings stay centralised. */
export const notify = {
  success: (message: string, options?: NotifyOptions) => show('success', message, options),
  info: (message: string, options?: NotifyOptions) => show('info', message, options),
  warning: (message: string, options?: NotifyOptions) => show('warning', message, options),
  error: (message: string, options?: NotifyOptions) => show('error', message, options),
  /** Escape hatch for explicit tone selection (e.g. data-driven dispatch). */
  tone: show,
  dismiss: (id?: string | number) => sonner.dismiss(id)
}
