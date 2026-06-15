import { useEffect, useState, type ComponentType } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ListChecks,
  ZoomIn,
  SunMoon,
  GalleryHorizontalEnd,
  Languages,
  Check,
  ArrowRight,
  Sparkles,
  MousePointer2,
  Image as ImageIcon,
} from 'lucide-react'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { cn } from '@/lib/utils'

const INTERVAL = 4000

const SCENES = ['carousel', 'quiz', 'zoom', 'theme', 'language'] as const
type SceneKind = (typeof SCENES)[number]

const FEATURE: Record<SceneKind, { icon: ComponentType<{ className?: string }>; label: string }> = {
  carousel: { icon: GalleryHorizontalEnd, label: 'Carrossel' },
  quiz: { icon: ListChecks, label: 'Quiz' },
  zoom: { icon: ZoomIn, label: 'Zoom' },
  theme: { icon: SunMoon, label: 'Tema' },
  language: { icon: Languages, label: 'Idioma' },
}

/* ── scenes ─────────────────────────────────────────────────────────────── */
function CarouselScene() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative flex-1 overflow-hidden rounded-lg">
        <motion.div
          className="flex h-full w-[200%]"
          initial={{ x: '0%' }}
          animate={{ x: ['0%', '0%', '-50%', '-50%'] }}
          transition={{ duration: 3.6, times: [0, 0.4, 0.7, 1], ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex w-1/2 flex-col gap-2 pr-2">
            <span className="text-sm font-semibold">O ciclo da água</span>
            <div className="flex-1 rounded-lg bg-primary/15" />
          </div>
          <div className="flex w-1/2 flex-col gap-2 pr-2">
            <span className="text-sm font-semibold">Evaporação</span>
            <div className="flex-1 rounded-lg bg-sky-500/20" />
          </div>
        </motion.div>
      </div>
      <div className="flex justify-center gap-1.5">
        {[0, 1].map((d) => (
          <motion.span
            key={d}
            className="h-1.5 rounded-full bg-current"
            animate={{
              width: d === 0 ? ['1.25rem', '1.25rem', '0.375rem'] : ['0.375rem', '0.375rem', '1.25rem'],
              opacity: d === 0 ? [1, 1, 0.3] : [0.3, 0.3, 1],
            }}
            transition={{ duration: 3.6, times: [0, 0.45, 0.75] }}
          />
        ))}
      </div>
    </div>
  )
}

function QuizScene() {
  const options = ['Herança', 'Composição', 'Globais']
  return (
    <div className="flex h-full flex-col gap-2.5">
      <span className="text-sm font-semibold">Strategy favorece…</span>
      <div className="flex flex-1 flex-col justify-center gap-2">
        {options.map((o, i) => {
          const correct = i === 1
          return (
            <motion.div
              key={o}
              animate={correct ? { backgroundColor: ['rgba(0,0,0,0)', 'rgba(16,185,129,0.15)'] } : {}}
              transition={{ delay: 2, duration: 0.4 }}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 text-xs',
                correct ? 'border-emerald-500/60' : 'border-current/15',
              )}
            >
              {o}
              {correct && (
                <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.1 }}>
                  <Check className="size-3.5 text-emerald-500" />
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>
      <motion.div
        className="pointer-events-none absolute z-10"
        initial={{ left: '72%', top: '82%', opacity: 0 }}
        animate={{ left: '47%', top: '54%', opacity: 1, scale: [1, 1, 0.8, 1] }}
        transition={{
          left: { duration: 1.7, ease: 'easeInOut' },
          top: { duration: 1.7, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
          scale: { duration: 0.45, delay: 1.7, times: [0, 0.3, 0.55, 1] },
        }}
      >
        <MousePointer2 className="size-4 fill-foreground text-foreground drop-shadow-sm" />
      </motion.div>
    </div>
  )
}

function ZoomScene() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-lg bg-primary/[0.06]">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(oklch(0.7_0.19_295/0.1)_1px,transparent_1px),linear-gradient(90deg,oklch(0.7_0.19_295/0.1)_1px,transparent_1px)] [background-size:22px_22px]" />
      <motion.div
        className="relative grid size-20 place-items-center rounded-xl bg-primary/20"
        animate={{ scale: [1, 1, 2.1, 2.1] }}
        transition={{ duration: 3.6, times: [0, 0.35, 0.7, 1], ease: [0.2, 0.8, 0.2, 1] }}
      >
        <ImageIcon className="size-7 text-primary" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute grid size-14 place-items-center rounded-full border-2 border-foreground/60"
        animate={{ x: [40, 0], y: [30, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.6, times: [0, 0.35, 0.7, 1] }}
      >
        <ZoomIn className="size-5 text-foreground/70" />
      </motion.div>
    </div>
  )
}

function ThemeScene() {
  return (
    <motion.div
      className="flex h-full flex-col gap-3 rounded-lg p-3"
      animate={{
        backgroundColor: ['#ffffff', '#ffffff', '#0d0b16', '#0d0b16'],
        color: ['#18181b', '#18181b', '#fafafa', '#fafafa'],
      }}
      transition={{ duration: 3.6, times: [0, 0.45, 0.6, 1] }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Tema adaptável</span>
        <SunMoon className="size-4 text-amber-500" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-[90%] rounded-full bg-current opacity-15" />
        <div className="h-2 w-[70%] rounded-full bg-current opacity-15" />
      </div>
      <div className="flex-1 rounded-lg border border-current/15 bg-current/5" />
    </motion.div>
  )
}

function LanguageScene() {
  const [en, setEn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEn(true), 2200)
    return () => clearTimeout(t)
  }, [])
  const c = en
    ? {
        title: 'The water cycle',
        bullets: ['Evaporation from oceans', 'Condensation into clouds', 'Precipitation as rain'],
        cap: 'Fig 3.1 — Hydrological cycle',
      }
    : {
        title: 'O ciclo da água',
        bullets: ['Evaporação dos oceanos', 'Condensação nas nuvens', 'Precipitação como chuva'],
        cap: 'Fig 3.1 — Ciclo hidrológico',
      }
  return (
    <div className="relative h-full">
      {/* language changer — top right */}
      <div className="absolute top-0 right-0 z-10 flex overflow-hidden rounded-md border border-current/20 text-[10px] font-semibold">
        <span className={cn('flex items-center gap-1 px-2 py-0.5 transition-colors', !en && 'bg-primary text-primary-foreground')}>
          <Languages className="size-3" />
          PT
        </span>
        <span className={cn('px-2 py-0.5 transition-colors', en && 'bg-primary text-primary-foreground')}>EN</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={en ? 'en' : 'pt'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex h-full flex-col gap-2 pr-16"
        >
          <h4 className="text-base font-semibold tracking-tight sm:text-lg">{c.title}</h4>
          <ul className="space-y-1.5">
            {c.bullets.map((bl, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="opacity-80">{bl}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-2">
            <div className="grid h-9 w-14 shrink-0 place-items-center rounded-md bg-primary/10">
              <ImageIcon className="size-4 text-primary" />
            </div>
            <span className="text-[10px] text-current opacity-50">{c.cap}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function SceneView({ kind }: { kind: SceneKind }) {
  if (kind === 'carousel') return <CarouselScene />
  if (kind === 'quiz') return <QuizScene />
  if (kind === 'zoom') return <ZoomScene />
  if (kind === 'theme') return <ThemeScene />
  return <LanguageScene />
}

/* ── the "after" card: auto-plays + navigatable feature tabs ────────────── */
function RichSlide({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  // setTimeout keyed on i: re-arms each scene, and resets when a tab is clicked.
  useEffect(() => {
    if (reduce) return
    const t = setTimeout(() => setI((p) => (p + 1) % SCENES.length), INTERVAL)
    return () => clearTimeout(t)
  }, [i, reduce])

  const kind = SCENES[i]
  const active = FEATURE[kind]

  return (
    <div className={cn('relative', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* branded header */}
        <div className="flex items-center justify-between bg-primary px-4 py-2.5 text-primary-foreground">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Check className="size-4" />
            Apresenta.ai
          </span>
          {/* live "feature in use" callout */}
          <AnimatePresence mode="wait">
            <motion.span
              key={kind}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5 rounded-full bg-primary-foreground px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              <active.icon className="size-3" />
              {active.label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* slide body */}
        <div className="relative flex aspect-[16/10] flex-col gap-3 bg-linear-to-br from-background to-muted/40 p-5 text-foreground sm:p-6">
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-primary">
            SLIDE 03 · Ciência
          </span>
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={kind}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                <SceneView kind={kind} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* navigatable feature tabs */}
        <div className="grid grid-cols-5 gap-1 border-t border-border bg-muted/40 p-2">
          {SCENES.map((k, idx) => {
            const { icon: Icon, label } = FEATURE[k]
            const on = idx === i
            return (
              <button
                key={k}
                onClick={() => setI(idx)}
                aria-pressed={on}
                aria-label={label}
                title={label}
                className={cn(
                  'relative flex min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 py-2 text-[11px] transition-colors sm:py-1.5',
                  on
                    ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                    : 'font-medium text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0 sm:size-3.5" />
                <span className="hidden truncate sm:inline">{label}</span>
                {on && !reduce && (
                  <motion.span
                    key={i}
                    className="absolute bottom-0 left-0 h-0.5 bg-primary-foreground/60"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── the dull "before" ──────────────────────────────────────────────────── */
function BoringSlide({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative shrink-0 -rotate-3 rounded-xl border border-border bg-muted/40 p-5 opacity-75 shadow-sm grayscale',
        className,
      )}
    >
      <span className="inline-block rounded-md bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        Slides chatos
      </span>
      <div className="mt-3 h-3 w-1/2 rounded bg-foreground/20" />
      <ul className="mt-4 space-y-2.5">
        {[80, 65, 72, 55].map((w, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            <span className="h-2 rounded-full bg-foreground/10" style={{ width: `${w}%` }} />
          </li>
        ))}
      </ul>
      <div className="mt-4 grid h-14 place-items-center rounded-md border border-dashed border-border bg-muted/60">
        <ImageIcon className="size-5 text-muted-foreground/40" />
      </div>
    </div>
  )
}

function TransformArrow({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex shrink-0 items-center justify-center', className)}>
      <motion.div
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-1.5"
      >
        <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg shadow-primary/30">
          <Sparkles className="size-3" />
          IA
        </span>
        <ArrowRight className="size-7 text-primary md:size-8" />
      </motion.div>
    </div>
  )
}

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <DotPattern
        width={22}
        height={22}
        className="-z-10 scale-125 fill-foreground/15 [mask-image:radial-gradient(460px_circle_at_center,white,transparent)]"
      />

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <BoringSlide className="hidden w-[30%] md:block" />
        <TransformArrow className="hidden md:flex" />
        <RichSlide className="mx-auto w-full max-w-md md:mx-0 md:max-w-none md:flex-1" />
      </div>
    </div>
  )
}
