/** Tiny easing/interpolation helpers shared by the progress-driven scenes.
    Each scene receives `progress` (0→1) and derives every value from it, so the
    animation is deterministic and scrubbable. */

export const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Map a sub-window [start, end] of the overall progress to its own 0→1 range. */
export const seg = (p: number, start: number, end: number): number =>
  Math.max(0, Math.min(1, (p - start) / (end - start)))
