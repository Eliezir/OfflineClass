import {
  WifiOff,
  ListChecks,
  Users,
  QrCode,
  Activity,
  BarChart3,
  Cloud,
  RadioTower,
  PlugZap,
  Apple,
  Monitor,
  Terminal,
  Network,
  Database,
  ShieldCheck,
  Presentation,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'

export const FEATURE_ICONS: Record<string, LucideIcon> = {
  offline: WifiOff,
  types: ListChecks,
  groups: Users,
  join: QrCode,
  panel: Activity,
  results: BarChart3,
  sync: Cloud,
}

export const PLATFORM_ICONS: Record<string, LucideIcon> = {
  apple: Apple,
  windows: Monitor,
  linux: Terminal,
}

export const APP_ICONS: Record<string, LucideIcon> = {
  teacher: Presentation,
  student: GraduationCap,
}

export const INTERACTIVE_ICONS: Record<string, LucideIcon> = {
  realtime: RadioTower,
  join: QrCode,
  groups: Users,
  panel: Activity,
  reconnect: PlugZap,
  offline: WifiOff,
}

export const UNDERHOOD_ICONS: Record<string, LucideIcon> = {
  discovery: RadioTower,
  crdt: Network,
  durable: Database,
  topology: ShieldCheck,
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string
  title: string
  description?: string
  center?: boolean
}) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <BlurFade>
        <div
          className={
            center
              ? 'mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1'
              : 'flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1'
          }
        >
          <AnimatedShinyText className="text-xs font-medium tracking-wide uppercase">
            {eyebrow}
          </AnimatedShinyText>
        </div>
      </BlurFade>
      <BlurFade delay={0.1}>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
      </BlurFade>
      {description && (
        <BlurFade delay={0.15}>
          <p className="mt-3 text-lg text-muted-foreground text-pretty">{description}</p>
        </BlurFade>
      )}
    </div>
  )
}
