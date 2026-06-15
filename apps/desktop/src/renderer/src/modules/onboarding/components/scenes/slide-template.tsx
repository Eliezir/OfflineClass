import { Trans, useLingui } from '@lingui/react/macro'
import aldrin from '@renderer/shared/assets/apollo-aldrin.jpg'
import { cn } from '@renderer/shared/utils'
import { AGENDA } from './content'
import type { SlideTheme } from './themes'

/** Outer box shared by the slides: a contained 16:9 card, or fills its parent
    when `fill` (used by the expanded fullscreen presenter). */
function slideBox(fill?: boolean): string {
  return cn(
    'relative flex flex-col justify-between overflow-hidden',
    fill ? 'size-full p-8' : 'aspect-video w-full p-6'
  )
}

/** Full title slide rendered in the given theme: the real NASA hero photo with
    a theme-tinted scrim and the deck's title — the generation reveal. */
export function SlideTemplate({
  theme,
  fill
}: {
  theme: SlideTheme
  fill?: boolean
}): React.JSX.Element {
  return (
    <div className={slideBox(fill)} style={{ background: theme.bg }}>
      <img
        src={aldrin}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: '50% 22%' }}
      />
      <div className="absolute inset-0" style={{ background: theme.scrim }} />

      <div className="relative flex items-center gap-2">
        <span className="h-px w-6" style={{ background: theme.accent }} />
        <span className="text-[10px] font-bold tracking-[0.22em]" style={{ color: theme.accent }}>
          <Trans>EXPLORAÇÃO ESPACIAL</Trans>
        </span>
      </div>

      <div className="relative">
        <h3
          className={cn('font-bold tracking-tight', theme.serif && 'font-serif')}
          style={{ color: theme.fg, fontSize: fill ? '40px' : '28px', lineHeight: 1.04 }}
        >
          <Trans>
            Apollo 11
            <br />A Chegada à Lua
          </Trans>
        </h3>
        <p className="mt-2" style={{ color: theme.muted, fontSize: fill ? '15px' : '12px' }}>
          <Trans>1969 · Missão tripulada à Lua</Trans>
        </p>
      </div>

      <div
        className="relative flex items-center justify-between"
        style={{ color: theme.muted, fontSize: fill ? '11px' : '9px' }}
      >
        <span>
          <Trans>Mar da Tranquilidade · Lua</Trans>
        </span>
        <span>01 / 08</span>
      </div>
    </div>
  )
}

/** Table-of-contents slide — the deck's second slide, reached by advancing. */
export function TocSlide({
  theme,
  fill
}: {
  theme: SlideTheme
  fill?: boolean
}): React.JSX.Element {
  const { i18n } = useLingui()
  return (
    <div className={slideBox(fill)} style={{ background: theme.bg }}>
      <div className="relative flex items-center gap-2">
        <span className="h-px w-6" style={{ background: theme.accent }} />
        <span className="text-[10px] font-bold tracking-[0.22em]" style={{ color: theme.accent }}>
          <Trans>SUMÁRIO</Trans>
        </span>
      </div>

      <ol className="relative space-y-3">
        {AGENDA.map((item, i) => (
          <li key={i18n._(item)} className="flex items-baseline gap-3">
            <span
              className="font-bold tabular-nums"
              style={{ color: theme.accent, fontSize: fill ? '24px' : '17px' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={cn('font-semibold', theme.serif && 'font-serif')}
              style={{ color: theme.fg, fontSize: fill ? '20px' : '15px' }}
            >
              {i18n._(item)}
            </span>
          </li>
        ))}
      </ol>

      <div
        className="relative flex items-center justify-between"
        style={{ color: theme.muted, fontSize: fill ? '11px' : '9px' }}
      >
        <span>
          <Trans>Apollo 11 · A Chegada à Lua</Trans>
        </span>
        <span>02 / 08</span>
      </div>
    </div>
  )
}

/** Compact thumbnail of a theme — used in the picker cards and the deck strip. */
export function MiniSlide({ theme }: { theme: SlideTheme }): React.JSX.Element {
  return (
    <div
      className="relative flex aspect-video flex-col justify-end overflow-hidden p-2.5"
      style={{ background: theme.bg }}
    >
      <img
        src={aldrin}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: '50% 20%' }}
      />
      <div className="absolute inset-0" style={{ background: theme.scrim }} />
      <div
        className={cn('relative text-[8px] font-bold leading-tight', theme.serif && 'font-serif')}
        style={{ color: theme.fg }}
      >
        <Trans>Apollo 11 · A Chegada à Lua</Trans>
      </div>
      <div className="relative mt-0.5 text-[6px]" style={{ color: theme.muted }}>
        <Trans>1969 · Missão à Lua</Trans>
      </div>
    </div>
  )
}
