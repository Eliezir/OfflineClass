import { useEffect, useRef, useState } from 'react'
import { Check, Eraser, Loader2, Smile } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import { Textarea } from '@renderer/shared/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/shared/ui/popover'

const MAX_LEN = 2000

/** Curated emojis useful when giving feedback on an exam answer. */
const FEEDBACK_EMOJIS = [
  '👍', '👏', '🙌', '💪', '⭐', '🌟', '✅', '✔️',
  '💯', '🎉', '🥳', '🚀', '📈', '💡', '🤔', '📝',
  '✍️', '📚', '⚠️', '❌', '❗', '😊'
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type CommentFieldProps = {
  /** Current saved value; null when none. */
  value: string | null
  onSave: (text: string) => void | Promise<unknown>
  placeholder: string
  ariaLabel: string
  /** One-click stamp phrases inserted at the caret. */
  stamps?: string[]
  /** Seeds the draft when there's no saved value yet (e.g. an MCQ suggestion). */
  initialDraft?: string
  className?: string
}

/** Default feedback stamps for the per-answer / overall comment fields. */
const DEFAULT_STAMPS = [
  'Ótimo raciocínio! 👏',
  'Muito bem! ✅',
  'Resposta incompleta.',
  'Revise o conceito.',
  'Faltou justificar.',
  'Atenção aos detalhes.'
]

/** Textarea for teacher feedback: emoji picker, one-click stamps, character
    counter, Ctrl+Enter to save, a clear button and a save-status indicator.
    Saves on blur / Ctrl+Enter when the text changed. */
export function CommentField({
  value,
  onSave,
  placeholder,
  ariaLabel,
  stamps,
  initialDraft,
  className
}: CommentFieldProps): React.JSX.Element {
  const { t } = useLingui()
  const seed = value ?? initialDraft ?? ''
  const [draft, setDraft] = useState(seed)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [pickerOpen, setPickerOpen] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  // Last known caret position, so inserts land where the teacher was typing.
  const caret = useRef<number | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => clearSavedTimer(), [])

  function clearSavedTimer(): void {
    if (savedTimer.current) clearTimeout(savedTimer.current)
  }

  function rememberCaret(el: HTMLTextAreaElement): void {
    caret.current = el.selectionStart
  }

  async function save(next: string = draft): Promise<void> {
    if (next === (value ?? '')) return
    setStatus('saving')
    try {
      await onSave(next)
      setStatus('saved')
      clearSavedTimer()
      savedTimer.current = setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }

  function insert(text: string, { spaced = false }: { spaced?: boolean } = {}): void {
    const pos = caret.current ?? draft.length
    const before = draft.slice(0, pos)
    const after = draft.slice(pos)
    const sep = spaced && before && !/\s$/.test(before) ? ' ' : ''
    const chunk = (sep + text).slice(0, Math.max(0, MAX_LEN - draft.length))
    const next = before + chunk + after
    setDraft(next)
    const nextPos = pos + chunk.length
    caret.current = nextPos
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.focus()
      el.setSelectionRange(nextPos, nextPos)
    })
  }

  function clear(): void {
    setDraft('')
    caret.current = 0
    void save('')
    requestAnimationFrame(() => ref.current?.focus())
  }

  const stampList = stamps ?? DEFAULT_STAMPS

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="relative">
        <Textarea
          ref={ref}
          value={draft}
          maxLength={MAX_LEN}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="min-h-16 pr-10 text-sm"
          onChange={(e) => {
            setDraft(e.target.value)
            rememberCaret(e.currentTarget)
          }}
          onSelect={(e) => rememberCaret(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void save()
            }
          }}
          onBlur={() => void save()}
        />
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t`Inserir emoji`}
              className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Smile className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="w-auto p-2"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-8 gap-0.5">
              {FEEDBACK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    insert(emoji)
                    setPickerOpen(false)
                  }}
                  className="grid size-8 place-items-center rounded-lg text-lg transition-colors hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick stamps */}
      <div className="flex flex-wrap gap-1.5">
        {stampList.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => insert(phrase, { spaced: true })}
            className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary-soft-foreground"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Footer: clear + status + counter */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {draft && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-destructive"
            >
              <Eraser className="size-3.5" />
              {t`Limpar`}
            </button>
          )}
          <SaveIndicator status={status} t={t} />
        </div>
        <span
          className={cn('tabular-nums', draft.length >= MAX_LEN && 'font-bold text-destructive')}
        >
          {draft.length}/{MAX_LEN}
        </span>
      </div>
    </div>
  )
}

function SaveIndicator({
  status,
  t
}: {
  status: SaveStatus
  t: ReturnType<typeof useLingui>['t']
}): React.JSX.Element | null {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1">
        <Loader2 className="size-3.5 animate-spin" />
        {t`Salvando…`}
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <Check className="size-3.5" />
        {t`Salvo`}
      </span>
    )
  }
  if (status === 'error') {
    return <span className="font-semibold text-destructive">{t`Erro ao salvar`}</span>
  }
  return null
}
