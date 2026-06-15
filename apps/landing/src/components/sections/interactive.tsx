import { Pencil } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { SectionHeading, INTERACTIVE_ICONS } from './shared'
import { site } from '@/content'

/** A small mock that demonstrates live group answering — shared text, a typing
    caret, presence/awareness tags and a "syncing" footer. */
function CollabMock() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-bold">Grupo A</span>
        <span className="flex -space-x-1.5">
          <i className="size-5 rounded-full border-2 border-card" style={{ background: 'oklch(0.7 0.17 270)' }} />
          <i className="size-5 rounded-full border-2 border-card" style={{ background: 'oklch(0.78 0.16 145)' }} />
          <i className="size-5 rounded-full border-2 border-card" style={{ background: 'oklch(0.84 0.15 80)' }} />
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="size-1.5 rounded-full bg-lime" />3 online
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="text-xs font-semibold text-muted-foreground">Questão 4 · Dissertativa</div>
        <p className="mt-2 text-sm leading-relaxed">
          A camada de transporte garante a entrega fim a fim entre os processos
          <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-primary align-middle" />
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'color-mix(in oklab, oklch(0.7 0.17 270) 16%, transparent)', color: 'oklch(0.7 0.17 270)' }}
          >
            <Pencil className="size-3" /> Maria está digitando…
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'color-mix(in oklab, oklch(0.84 0.15 80) 18%, transparent)', color: 'oklch(0.84 0.15 80)' }}
          >
            João · na questão 3
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-lime" /> respostas sincronizadas em tempo real
      </div>
    </div>
  )
}

export function Interactive() {
  return (
    <section
      id="ao-vivo"
      className="relative scroll-mt-24 border-y border-border bg-card/30 py-20 sm:py-28"
    >
      <div className="container-page">
        <SectionHeading
          center
          eyebrow="Ao vivo"
          title="Colaboração em tempo real, na rede da sala"
          description="Os alunos entram pela Wi-Fi local e respondem juntos — com presença, sincronização e um painel ao vivo para o professor acompanhar tudo."
        />

        <BlurFade delay={0.2} className="mt-12">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="lg:sticky lg:top-28">
              <CollabMock />
            </div>

            <ul className="flex flex-col gap-3">
              {site.interactive.map((c) => {
                const Icon = INTERACTIVE_ICONS[c.icon]
                return (
                  <li
                    key={c.title}
                    className="flex gap-3.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      {Icon && <Icon className="size-[18px]" />}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">{c.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{c.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
