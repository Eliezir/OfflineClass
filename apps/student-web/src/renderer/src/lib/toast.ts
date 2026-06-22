import { toast as sonner } from 'sonner'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

type NotifyOptions = {
  description?: string
  id?: string | number
  duration?: number
}

function show(tone: ToastTone, message: string, options: NotifyOptions = {}): string | number {
  return sonner[tone](message, {
    id: options.id,
    description: options.description,
    duration: options.duration ?? 4000
  })
}

/** Simple toast helper — fire-and-forget notifications. For the student app
    we keep it minimal (no sound, no settings persistence). */
export const notify = {
  success: (message: string, options?: NotifyOptions) => show('success', message, options),
  info: (message: string, options?: NotifyOptions) => show('info', message, options),
  warning: (message: string, options?: NotifyOptions) => show('warning', message, options),
  error: (message: string, options?: NotifyOptions) => show('error', message, options),
  dismiss: (id?: string | number) => sonner.dismiss(id)
}
