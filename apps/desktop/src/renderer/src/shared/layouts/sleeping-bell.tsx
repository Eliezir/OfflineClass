import { useThemeContext } from '@renderer/shared/hooks/theme-context'
import sleepingBellLight from '@renderer/shared/assets/sleeping-bell.webm?url'
import sleepingBellDark from '@renderer/shared/assets/sleeping-bell-dark.webm?url'

/** Empty-state illustration: a transparent (matted) WebM of the napping bell —
    a light-bg and a dark-bg version per theme — with the floating z's layered
    on top as themeable, animated SVG text (honors prefers-reduced-motion). The
    `key` re-mounts the video on theme change so autoplay restarts. */
export function SleepingBell(): React.JSX.Element {
  const { isDark } = useThemeContext()
  const src = isDark ? sleepingBellDark : sleepingBellLight

  return (
    <div className="relative">
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="size-32 object-contain"
      />
      <svg
        viewBox="0 0 40 36"
        className="pointer-events-none absolute -top-1 right-0 h-9 w-9 overflow-visible"
        fontWeight="700"
        fontStyle="italic"
        style={{ fill: 'var(--foreground)' }}
        aria-hidden
      >
        <text className="nb-z nb-z1" x="4" y="32" fontSize="11">
          z
        </text>
        <text className="nb-z nb-z2" x="14" y="21" fontSize="13">
          z
        </text>
        <text className="nb-z nb-z3" x="26" y="11" fontSize="16">
          z
        </text>
      </svg>
    </div>
  )
}
