import {
  Sparkles,
  MessagesSquare,
  Palette,
  Code2,
  Presentation,
  History,
  PenLine,
  KeyRound,
  Apple,
  Monitor,
  Terminal,
  ListChecks,
  GalleryHorizontalEnd,
  ZoomIn,
  Keyboard,
  SunMoon,
  Languages,
  type LucideIcon,
} from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'

export const FEATURE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  chat: MessagesSquare,
  palette: Palette,
  code: Code2,
  present: Presentation,
  history: History,
  editor: PenLine,
  key: KeyRound,
}

export const PLATFORM_ICONS: Record<string, LucideIcon> = {
  apple: Apple,
  windows: Monitor,
  linux: Terminal,
}

export const INTERACTIVE_ICONS: Record<string, LucideIcon> = {
  quiz: ListChecks,
  carousel: GalleryHorizontalEnd,
  zoom: ZoomIn,
  shortcuts: Keyboard,
  theme: SunMoon,
  language: Languages,
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
