import type { ToastTone } from '@renderer/modules/settings/toast-tones'

/** Short two-note blip per tone via the Web Audio API (no audio assets shipped).
    The context is created lazily, after a user gesture, as browsers require. */
let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctor =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    context ??= new Ctor()
    return context
  } catch {
    return null
  }
}

const FREQUENCIES: Record<ToastTone, [number, number]> = {
  success: [660, 880],
  info: [620, 720],
  warning: [520, 440],
  error: [440, 330]
}

export function playNotificationSound(tone: ToastTone): void {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const [from, to] = FREQUENCIES[tone]
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, now)
  osc.frequency.exponentialRampToValueAtTime(to, now + 0.12)

  // Fade in/out so it reads as a chime, not a click.
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.24)
}
