type ClaudeMarkProps = {
  className?: string
  style?: React.CSSProperties
}

/** Placeholder for the Claude "sunburst" mark — radiating rounded blades, drawn
    in `currentColor` so it inherits the provider accent. Swap for the official
    Anthropic asset when we have clearance + the source SVG. */
const BLADES = 12

export function ClaudeMark({ className, style }: ClaudeMarkProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden>
      {Array.from({ length: BLADES }).map((_, i) => (
        <rect
          key={i}
          x="11.05"
          y="2.4"
          width="1.9"
          height="9.6"
          rx="0.95"
          transform={`rotate(${(360 / BLADES) * i} 12 12)`}
        />
      ))}
    </svg>
  )
}
