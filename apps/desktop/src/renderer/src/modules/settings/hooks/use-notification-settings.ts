import { useSyncExternalStore } from 'react'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type NotificationSettings = {
  position: ToastPosition
  /** Seconds the toast stays before auto-dismissing. */
  duration: number
  autoDismiss: boolean
  sound: boolean
}

export type NotificationSettingsController = NotificationSettings & {
  setPosition: (position: ToastPosition) => void
  setDuration: (duration: number) => void
  setAutoDismiss: (autoDismiss: boolean) => void
  setSound: (sound: boolean) => void
}

const STORAGE_KEY = 'offlineclass:notifications'

const DEFAULTS: NotificationSettings = {
  position: 'bottom-right',
  duration: 5,
  autoDismiss: true,
  sound: false
}

const VALID_POSITIONS: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
]

/** Merge a persisted (possibly stale/partial) blob onto the defaults. */
function coerce(raw: unknown): NotificationSettings {
  if (!raw || typeof raw !== 'object') return DEFAULTS
  const r = raw as Partial<NotificationSettings>
  return {
    position: VALID_POSITIONS.includes(r.position as ToastPosition)
      ? (r.position as ToastPosition)
      : DEFAULTS.position,
    duration: typeof r.duration === 'number' && r.duration > 0 ? r.duration : DEFAULTS.duration,
    autoDismiss: typeof r.autoDismiss === 'boolean' ? r.autoDismiss : DEFAULTS.autoDismiss,
    sound: typeof r.sound === 'boolean' ? r.sound : DEFAULTS.sound
  }
}

function readPersisted(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? coerce(JSON.parse(saved)) : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

// Single source of truth shared by the Toaster and the Settings controls.
let current: NotificationSettings = readPersisted()
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Read the current settings outside of React (used by the notify helper). */
export function getNotificationSettings(): NotificationSettings {
  return current
}

function update(patch: Partial<NotificationSettings>): void {
  current = { ...current, ...patch }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    /* ignore — settings simply won't persist across launches */
  }
  emit()
}

const controller: Omit<NotificationSettingsController, keyof NotificationSettings> = {
  setPosition: (position) => update({ position }),
  setDuration: (duration) => update({ duration }),
  setAutoDismiss: (autoDismiss) => update({ autoDismiss }),
  setSound: (sound) => update({ sound })
}

/** Persisted notification preferences, shared between the Toaster and Settings. */
export function useNotificationSettings(): NotificationSettingsController {
  const settings = useSyncExternalStore(subscribe, getNotificationSettings, getNotificationSettings)
  return { ...settings, ...controller }
}
