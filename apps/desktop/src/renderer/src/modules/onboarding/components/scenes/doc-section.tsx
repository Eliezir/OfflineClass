import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import type { DocSection as DocSectionData } from './content'

type Mode = 'full' | 'prose' | 'topics'

/** One Markdown section of the demo document. `full` shows lead + bullets (the
    finished doc); `prose` shows only the paragraph (before the AI restructures);
    `topics` shows only the bullets (after). */
export function DocSection({
  section,
  mode = 'full'
}: {
  section: DocSectionData
  mode?: Mode
}): React.JSX.Element {
  const { i18n } = useLingui()
  return (
    <div className="space-y-1.5">
      <div className="font-mono text-[12px] font-bold text-foreground/90">
        <span className="text-primary/70">## </span>
        {i18n._(section.title)}
      </div>

      {mode !== 'topics' && section.lead && (
        <p className="font-mono text-[12px] leading-relaxed text-foreground/75">
          {i18n._(section.lead)}
        </p>
      )}

      {mode !== 'prose' && (
        <ul className={cn(mode === 'topics' && 'animate-in space-y-1.5 fade-in', 'space-y-1.5')}>
          {section.bullets.map((b) => (
            <li
              key={i18n._(b)}
              className="flex gap-2 font-mono text-[12px] leading-relaxed text-foreground/80"
            >
              <span className="text-primary/60">-</span>
              <span>{i18n._(b)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
