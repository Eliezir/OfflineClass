import { useState } from 'react'
import { X, Shuffle, Check } from 'lucide-react'
import type { AvatarConfig } from '@offlineclass/shared'

import { avatarSvg } from './dicebear'
import {
  randomAvatar,
  SKIN_COLORS,
  HAIR_COLORS,
  BACKGROUND_COLORS,
  HAIR_STYLES,
  EYES,
  EYEBROWS,
  MOUTHS,
  GLASSES,
  EARRINGS,
  FEATURES
} from './parts'
import { cn } from './cn'
import { TabIcon, type TabIconName } from './tab-icons'

type ColorDef = { key: keyof AvatarConfig; values: readonly string[]; sub: string }
type StyleDef = { key: keyof AvatarConfig; values: readonly string[]; optional?: boolean; sub: string }
type Cat = { label: string; icon: TabIconName; color?: ColorDef; styles?: StyleDef[] }

const CATS: Cat[] = [
  { label: 'Pele', icon: 'face', color: { key: 'skinColor', values: SKIN_COLORS, sub: 'Tom de pele' } },
  {
    label: 'Cabelo',
    icon: 'comb',
    color: { key: 'hairColor', values: HAIR_COLORS, sub: 'Cor do cabelo' },
    styles: [{ key: 'hair', values: HAIR_STYLES, optional: true, sub: 'Estilo' }]
  },
  { label: 'Olhos', icon: 'eye', styles: [{ key: 'eyes', values: EYES, sub: 'Olhos' }] },
  { label: 'Sobrancelha', icon: 'eyebrow', styles: [{ key: 'eyebrows', values: EYEBROWS, sub: 'Sobrancelha' }] },
  { label: 'Boca', icon: 'smiley', styles: [{ key: 'mouth', values: MOUTHS, sub: 'Expressão' }] },
  {
    label: 'Acessórios',
    icon: 'glasses',
    styles: [
      { key: 'glasses', values: GLASSES, optional: true, sub: 'Óculos' },
      { key: 'earrings', values: EARRINGS, optional: true, sub: 'Brincos' },
      { key: 'features', values: FEATURES, optional: true, sub: 'Detalhes do rosto' }
    ]
  },
  { label: 'Fundo', icon: 'frame', color: { key: 'backgroundColor', values: BACKGROUND_COLORS, sub: 'Cor de fundo' } }
]

const SCOPED_CSS = `
.ab-preview svg { width: 100% !important; height: auto !important; display: block; }
@keyframes abSlideR { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes abSlideL { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
.ab-slide-right { animation: abSlideR .26s cubic-bezier(0.2,0.8,0.2,1); }
.ab-slide-left { animation: abSlideL .26s cubic-bezier(0.2,0.8,0.2,1); }
.ab-tip { opacity: 0; transition: opacity .12s; }
.ab-tab:hover .ab-tip { opacity: 1; transition-delay: .5s; }
`

export interface AvatarBuilderProps {
  value: AvatarConfig
  onChange: (next: AvatarConfig) => void
  onDone: () => void
  onClose?: () => void
}

export function AvatarBuilder({ value, onChange, onDone, onClose }: AvatarBuilderProps): React.JSX.Element {
  const [active, setActive] = useState(1)
  const [dir, setDir] = useState<'left' | 'right'>('right')
  const cat = CATS[active]

  function selectTab(i: number): void {
    if (i === active) return
    setDir(i > active ? 'right' : 'left')
    setActive(i)
  }

  const set = (key: keyof AvatarConfig, val: string): void => onChange({ ...value, [key]: val })

  return (
    <div className="flex h-full w-full flex-col lg:flex-row">
      <style>{SCOPED_CSS}</style>

      {/* ── Preview hero ─────────────────────────────────────────────── */}
      <div
        className="relative flex h-72 shrink-0 items-center justify-center overflow-hidden p-8 lg:h-auto lg:flex-[0_0_46%] lg:p-12"
        style={{ background: `#${value.backgroundColor || 'a5b4fc'}` }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 left-4 z-10 grid size-10 place-items-center rounded-full bg-white text-gray-900 shadow-md transition hover:bg-white/90"
          >
            <X className="size-4.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange(randomAvatar())}
          aria-label="Avatar aleatório"
          className="absolute right-4 bottom-4 z-10 grid size-12 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow active:scale-95"
        >
          <Shuffle className="size-5" />
        </button>
        <div
          className="ab-preview w-44 max-w-full lg:w-[70%] lg:max-w-[320px]"
          dangerouslySetInnerHTML={{ __html: avatarSvg(value, { background: false }) }}
        />
      </div>

      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* desktop header with Concluir */}
        <div className="hidden shrink-0 items-center justify-end border-b border-border px-4 py-3 lg:flex">
          <DoneButton onClick={onDone} />
        </div>

        {/* tabs */}
        <div className="flex shrink-0 gap-1 border-b border-border px-2">
          {CATS.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={() => selectTab(i)}
              aria-label={c.label}
              className={cn(
                'ab-tab group relative -mb-px flex flex-1 items-center justify-center border-b-[3px] px-1.5 py-4 transition-colors',
                i === active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <TabIcon name={c.icon} />
              <span className="ab-tip pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[11px] font-extrabold whitespace-nowrap text-background shadow">
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* panel — slides on tab switch (keyed remount), not on option pick */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div key={`${active}-${dir}`} className={dir === 'right' ? 'ab-slide-right' : 'ab-slide-left'}>
            {cat.color && (
              <ColorRow def={cat.color} selected={value[cat.color.key]} onPick={set} />
            )}
            {cat.styles?.map((st) => (
              <StyleGrid key={st.key} def={st} value={value} onPick={set} />
            ))}
          </div>
        </div>

        {/* mobile Concluir */}
        <div className="shrink-0 border-t border-border p-4 lg:hidden">
          <DoneButton onClick={onDone} full />
        </div>
      </div>
    </div>
  )
}

function DoneButton({ onClick, full }: { onClick: () => void; full?: boolean }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold tracking-wide text-primary-foreground uppercase shadow-sm transition active:translate-y-0.5',
        full && 'w-full'
      )}
    >
      <Check className="size-4" />
      Concluir
    </button>
  )
}

function ColorRow({
  def,
  selected,
  onPick
}: {
  def: ColorDef
  selected: string
  onPick: (key: keyof AvatarConfig, val: string) => void
}): React.JSX.Element {
  return (
    <>
      <h3 className="px-5 pt-4 text-base font-extrabold">{def.sub}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3 px-5 pt-3">
        {def.values.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            onClick={() => onPick(def.key, hex)}
            style={{ background: `#${hex}` }}
            className={cn(
              'aspect-square rounded-2xl border-4 border-card shadow-sm transition',
              selected === hex ? 'ring-[3px] ring-primary' : 'ring-1 ring-border'
            )}
          />
        ))}
      </div>
    </>
  )
}

function StyleGrid({
  def,
  value,
  onPick
}: {
  def: StyleDef
  value: AvatarConfig
  onPick: (key: keyof AvatarConfig, val: string) => void
}): React.JSX.Element {
  const values = def.optional ? ['', ...def.values] : def.values
  return (
    <>
      <h3 className="px-5 pt-4 text-base font-extrabold">{def.sub}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-3 px-5 pt-3 pb-6">
        {values.map((val) => {
          const sel = value[def.key] === val
          return (
            <button
              key={val || 'none'}
              type="button"
              onClick={() => onPick(def.key, val)}
              className={cn(
                'aspect-square overflow-hidden rounded-2xl border-2 shadow-sm transition hover:-translate-y-0.5',
                sel ? 'border-primary bg-primary/10 ring-[3px] ring-primary/30' : 'border-border bg-card'
              )}
              // The "none" option (val='') renders the avatar WITHOUT this feature.
              dangerouslySetInnerHTML={{ __html: avatarSvg({ ...value, [def.key]: val }, { background: false }) }}
            />
          )
        })}
      </div>
    </>
  )
}
