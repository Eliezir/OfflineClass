/* Decorative violet backlight + twinkling starfield, matching the native
   splash window (public/splash.html). Star positions are computed once at
   module load so they stay stable across renders (and keep the render pure). */

type StarDef = {
  id: number
  top: string
  left: string
  size: number
  delay: number
  duration: number
  low: number
  high: number
  accent: boolean
}

const STARS: StarDef[] = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: 1 + Math.random() * 1.8,
  delay: -Math.random() * 5,
  duration: 3 + Math.random() * 4,
  low: 0.05 + Math.random() * 0.15,
  high: 0.4 + Math.random() * 0.4,
  accent: Math.random() < 0.25
}))

function Backlight(): React.JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background: `
          radial-gradient(ellipse 50% 50% at 30% 38%, oklch(0.46 0.26 295 / 0.42), transparent 70%),
          radial-gradient(ellipse 45% 45% at 72% 55%, oklch(0.62 0.26 300 / 0.32), transparent 70%),
          radial-gradient(ellipse 55% 45% at 50% 92%, oklch(0.80 0.16 290 / 0.30), transparent 70%)
        `,
        filter: 'blur(60px)'
      }}
    />
  )
}

function Stars(): React.JSX.Element {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full"
          style={
            {
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: s.accent ? 'var(--star-accent)' : 'var(--star-color)',
              animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
              '--twinkle-low': s.low,
              '--twinkle-high': s.high
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** Full-bleed decorative background for the onboarding flow. */
export function SpaceBackdrop(): React.JSX.Element {
  return (
    <>
      <Backlight />
      <Stars />
    </>
  )
}
