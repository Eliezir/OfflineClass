import { Accessibility, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useThemeContext } from '@/lib/ThemeProvider'
import { FONT_SCALES, type ThemeMode } from '@/lib/useTheme'
import { Segmented, type SegmentedOption } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const THEME_OPTIONS: SegmentedOption<ThemeMode>[] = [
  { value: 'light', label: 'Claro', icon: <Sun className="size-3.5" /> },
  { value: 'dark', label: 'Escuro', icon: <Moon className="size-3.5" /> },
  { value: 'system', label: 'Sistema', icon: <Monitor className="size-3.5" /> }
]

const SIZE_LABELS: Record<number, string> = {
  0.9: 'Texto pequeno',
  1: 'Texto padrão',
  1.15: 'Texto grande',
  1.3: 'Texto muito grande'
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps): React.JSX.Element {
  const {
    theme,
    setTheme,
    fontScale,
    setFontScale,
    contrast,
    setContrast,
    reduceMotion,
    setReduceMotion,
    legibleFont,
    setLegibleFont
  } = useThemeContext()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>Personalize a aparência e a acessibilidade.</DialogDescription>
        </DialogHeader>

        {/* ── Exibição ──────────────────────────────────────────────────── */}
        <Section icon={<Palette className="size-5" />} title="Exibição" desc="Tema e tamanho do texto.">
          <Row label="Tema" hint="Claro, escuro ou seguir o sistema.">
            <Segmented
              ariaLabel="Tema"
              options={THEME_OPTIONS}
              value={theme}
              onChange={setTheme}
              fullWidth
              className="@sm:w-auto w-full"
            />
          </Row>
          <Row label="Tamanho do texto" hint="Aumenta o enunciado e as respostas.">
            <div
              role="radiogroup"
              aria-label="Tamanho do texto"
              className="@sm:w-auto flex w-full gap-1 rounded-full border border-border bg-muted/50 p-1"
            >
              {FONT_SCALES.map((scale, i) => {
                const selected = fontScale === scale
                return (
                  <button
                    key={scale}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={SIZE_LABELS[scale]}
                    onClick={() => setFontScale(scale)}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 leading-none font-bold outline-none transition-colors duration-200',
                      'focus-visible:ring-[3px] focus-visible:ring-ring/25',
                      selected
                        ? 'bg-card text-foreground shadow-[var(--edge-soft)] ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={{ fontSize: `${0.7 + i * 0.18}rem` }}
                  >
                    A
                  </button>
                )
              })}
            </div>
          </Row>
        </Section>

        {/* ── Acessibilidade ────────────────────────────────────────────── */}
        <Section
          icon={<Accessibility className="size-5" />}
          title="Acessibilidade"
          desc="Contraste, movimento e legibilidade."
        >
          <ToggleRow
            label="Alto contraste"
            hint="Bordas e textos mais fortes."
            checked={contrast}
            onChange={setContrast}
          />
          <ToggleRow
            label="Reduzir animações"
            hint="Desliga pulsos e transições."
            checked={reduceMotion}
            onChange={setReduceMotion}
          />
          <ToggleRow
            label="Fonte legível"
            hint="Tipografia de alta legibilidade (Atkinson)."
            checked={legibleFont}
            onChange={setLegibleFont}
          />
        </Section>
      </DialogContent>
    </Dialog>
  )
}

function Section({
  icon,
  title,
  desc,
  children
}: {
  icon: React.ReactNode
  title: string
  desc: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[6px] bg-primary-soft text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </section>
  )
}

function Row({
  label,
  hint,
  children
}: {
  label: string
  hint: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="@sm:flex-row @sm:items-center @sm:justify-between @sm:gap-4 flex flex-col gap-2.5 px-5 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{hint}</p>
      </div>
      <div className="@sm:w-auto @sm:shrink-0 w-full">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (on: boolean) => void
}): React.JSX.Element {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  )
}
