import { Trans, useLingui } from '@lingui/react/macro'
import { Check, Send } from 'lucide-react'
import earthrise from '@renderer/shared/assets/apollo-earthrise.jpg'
import { cn } from '@renderer/shared/utils'
import { Cursor } from '../cursor'
import { easeInOut, lerp, seg } from './anim'
import { SECTIONS } from './content'
import { DocSection } from './doc-section'

/* Feature 2 — "A IA vira roteiro": the document on the left, a chat sidebar on
   the right. The composer types a request, the cursor clicks Send, and the
   "O pouso na Lua" section restructures from prose into topics. */

// O pouso na Lua (prose → topics), then the sections that follow it.
const POUSO = SECTIONS[3]
const SUPERFICIE = SECTIONS[4]
const LEGADO = SECTIONS[5]

export function ScriptScene({ progress }: { progress: number }): React.JSX.Element {
  const { t } = useLingui()
  const MSG = t`deixa a seção do pouso em tópicos`
  const p = progress

  // Cursor travels to the Send button in the sidebar as the message finishes.
  const move = easeInOut(seg(p, 0.08, 0.24))
  const cx = lerp(108, 96, move)
  const cy = lerp(120, 93, move)
  const sendClick = p >= 0.24 && p < 0.3

  const typed = MSG.slice(0, Math.round(easeInOut(seg(p, 0.06, 0.22)) * MSG.length))
  const sent = p >= 0.28
  const thinking = p >= 0.44 && p < 0.6
  const restructured = p >= 0.6
  const replied = p >= 0.64

  return (
    <>
      <div className="flex h-full">
        {/* Document — left panel */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="space-y-4 px-5 pt-4 pb-4">
            <div className="flex gap-4">
              <div className="min-w-0 flex-1">
                <DocSection section={POUSO} mode={restructured ? 'topics' : 'prose'} />
              </div>
              <figure className="w-36 shrink-0 space-y-1">
                <img
                  src={earthrise}
                  alt=""
                  className="aspect-video w-full rounded-md object-cover"
                  style={{ objectPosition: '50% 42%' }}
                />
                <figcaption className="font-mono text-[9px] text-muted-foreground">
                  <Trans>A Terra vista do espaço · NASA</Trans>
                </figcaption>
              </figure>
            </div>

            <DocSection section={SUPERFICIE} mode="topics" />
            <DocSection section={LEGADO} mode="topics" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Chat — right sidebar */}
        <aside className="flex w-[232px] shrink-0 flex-col border-l border-border/70 bg-muted/20">
          <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2.5 font-mono text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-primary" />
            <Trans>Chat com a IA</Trans>
          </div>

          <div className="flex-1 space-y-2 overflow-hidden p-3">
            <div
              className={cn(
                'flex justify-end transition-all duration-300 [transition-timing-function:var(--ease-out)]',
                sent ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              )}
            >
              <span className="max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-[11px] leading-snug text-primary-foreground">
                {MSG}
              </span>
            </div>

            <div
              className={cn(
                'flex justify-start transition-opacity duration-300',
                thinking || replied ? 'opacity-100' : 'opacity-0'
              )}
            >
              <span className="flex max-w-[90%] items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
                {thinking ? (
                  <>
                    <Dot delay={0} />
                    <Dot delay={160} />
                    <Dot delay={320} />
                  </>
                ) : (
                  <>
                    <Check className="size-3 text-success" />
                    <Trans>Pronto — virou tópicos</Trans>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Composer */}
          <div className="p-3 pt-0">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                {sent || !typed ? (
                  <span className="text-muted-foreground">
                    <Trans>Peça uma alteração…</Trans>
                  </span>
                ) : (
                  <span className="text-foreground/80">{typed}</span>
                )}
                {!sent && typed.length > 0 && (
                  <span className="ml-px inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
                )}
              </span>
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-transform duration-150',
                  sendClick && 'scale-90'
                )}
              >
                <Send className="size-3" />
              </span>
            </div>
          </div>
        </aside>
      </div>

      <Cursor x={cx} y={cy} clicking={sendClick} visible={p <= 0.34} />
    </>
  )
}

function Dot({ delay }: { delay: number }): React.JSX.Element {
  return (
    <span
      className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}
