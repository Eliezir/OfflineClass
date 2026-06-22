import { Moon, Palette, Sun } from 'lucide-react'
import { useThemeContext } from '@/lib/ThemeProvider'
import { Segmented, type SegmentedOption } from '@/components/ui/segmented'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

type ThemeValue = 'light' | 'dark'

const THEME_OPTIONS: SegmentedOption<ThemeValue>[] = [
  { value: 'light', label: 'Claro', icon: <Sun className="size-3.5" /> },
  { value: 'dark', label: 'Escuro', icon: <Moon className="size-3.5" /> }
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps): React.JSX.Element {
  const { isDark, setIsDark } = useThemeContext()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Personalize a aparência do app.
          </DialogDescription>
        </DialogHeader>

        {/* ── Appearance section ──────────────────────────────────────── */}
        <section className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-[6px] bg-primary-soft text-primary">
              <Palette className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">Aparência</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Personalize a aparência do app.
              </p>
            </div>
          </div>

          <div className="px-5 py-3.5">
            <div className="flex flex-col gap-2.5 @sm:flex-row @sm:items-center @sm:justify-between @sm:gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  Tema
                </div>
                <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
                  Escolha entre o tema claro e escuro do app.
                </p>
              </div>
              <div className="@sm:shrink-0">
                <Segmented
                  ariaLabel="Tema"
                  options={THEME_OPTIONS}
                  value={isDark ? 'dark' : 'light'}
                  onChange={(v) => setIsDark(v === 'dark')}
                />
              </div>
            </div>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  )
}
