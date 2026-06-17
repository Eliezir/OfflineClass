import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  CodeLanguages,
  QuestionInput,
  type CodeLanguage,
  type Question
} from '@offlineclass/shared'
import { Badge } from '@renderer/shared/ui/badge'
import { Button } from '@renderer/shared/ui/button'
import { Checkbox } from '@renderer/shared/ui/checkbox'
import { CodeEditor } from '@renderer/shared/ui/code-editor'
import { Input } from '@renderer/shared/ui/input'
import { RadioGroup, RadioGroupItem } from '@renderer/shared/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/shared/ui/select'
import { Textarea } from '@renderer/shared/ui/textarea'
import { fileToDataUrl } from '@renderer/shared/utils/image'
import { cn } from '@renderer/shared/utils'
import { useUpdateQuestion } from '../queries'
import { PointsField } from './points-field'

type Option = { id: string; text: string; correct: boolean }

type State = {
  prompt: string
  points: string
  image: string | null
  options: Option[]
  tfAnswer: boolean
  language: CodeLanguage
  starterCode: string
}

type QuestionBlockProps = {
  examId: string
  question: Question
  index: number
  onDelete: () => void
}

const KIND_LABEL: Record<Question['kind'], React.ReactNode> = {
  mcq: <Trans>Múltipla escolha</Trans>,
  multi: <Trans>Múltiplas respostas</Trans>,
  truefalse: <Trans>Verdadeiro ou falso</Trans>,
  essay: <Trans>Dissertativa</Trans>,
  code: <Trans>Código</Trans>
}

const newOption = (): Option => ({ id: crypto.randomUUID(), text: '', correct: false })

export function QuestionBlock({
  examId,
  question,
  index,
  onDelete
}: QuestionBlockProps): React.JSX.Element {
  const { t } = useLingui()
  const update = useUpdateQuestion(examId)
  const fileInput = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id
  })

  const [prompt, setPrompt] = useState(question.prompt)
  const [points, setPoints] = useState(String(question.points))
  const [image, setImage] = useState<string | null>(question.image ?? null)
  const [options, setOptions] = useState<Option[]>(
    question.kind === 'mcq' || question.kind === 'multi'
      ? question.options.map((o) => ({ id: o.id, text: o.text, correct: o.correct }))
      : []
  )
  const [tfAnswer, setTfAnswer] = useState(question.kind === 'truefalse' ? question.answer : true)
  const [language, setLanguage] = useState<CodeLanguage>(
    question.kind === 'code' ? question.language : 'plaintext'
  )
  const [starterCode, setStarterCode] = useState(
    question.kind === 'code' ? question.starterCode : ''
  )
  const [error, setError] = useState<string | null>(null)

  const build = (s: State): unknown => {
    const base = { prompt: s.prompt.trim(), points: Number(s.points), image: s.image }
    switch (question.kind) {
      case 'mcq':
      case 'multi':
        return {
          kind: question.kind,
          ...base,
          options: s.options.map((o) => ({ id: o.id, text: o.text.trim(), correct: o.correct }))
        }
      case 'truefalse':
        return { kind: 'truefalse', ...base, answer: s.tfAnswer }
      case 'code':
        return { kind: 'code', ...base, language: s.language, starterCode: s.starterCode }
      default:
        return { kind: 'essay', ...base }
    }
  }

  const lastSaved = useRef(
    JSON.stringify(build({ prompt, points, image, options, tfAnswer, language, starterCode }))
  )

  const save = (override: Partial<State> = {}): void => {
    const next: State = {
      prompt,
      points,
      image,
      options,
      tfAnswer,
      language,
      starterCode,
      ...override
    }
    const input = build(next)
    const serial = JSON.stringify(input)
    if (serial === lastSaved.current) return
    const parsed = QuestionInput.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t`Questão incompleta`)
      return
    }
    setError(null)
    lastSaved.current = serial
    update.mutate({ id: question.id, input: parsed.data })
  }

  // -- option helpers (mcq = single correct, multi = many) --
  const toggleCorrect = (id: string): void => {
    const next =
      question.kind === 'mcq'
        ? options.map((o) => ({ ...o, correct: o.id === id }))
        : options.map((o) => (o.id === id ? { ...o, correct: !o.correct } : o))
    setOptions(next)
    save({ options: next })
  }
  const setOptionText = (id: string, text: string): void =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)))
  const addOption = (): void => setOptions((prev) => [...prev, newOption()])
  const removeOption = (id: string): void => {
    const next = options.filter((o) => o.id !== id)
    setOptions(next)
    save({ options: next })
  }

  const setPointsValue = (n: number): void => {
    const s = String(n)
    setPoints(s)
    save({ points: s })
  }

  // -- image --
  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      setImage(dataUrl)
      save({ image: dataUrl })
    } catch {
      setError(t`Não foi possível carregar a imagem.`)
    }
  }
  const removeImage = (): void => {
    setImage(null)
    save({ image: null })
  }

  const isChoice = question.kind === 'mcq' || question.kind === 'multi'

  const optionRow = (o: Option, i: number, control: React.ReactNode): React.JSX.Element => (
    <div key={o.id} className="flex items-center gap-2">
      {control}
      <Input
        value={o.text}
        onChange={(e) => setOptionText(o.id, e.target.value)}
        onBlur={() => save()}
        placeholder={t`Alternativa ${i + 1}`}
      />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={t`Remover alternativa`}
        disabled={options.length <= 2}
        onClick={() => removeOption(o.id)}
      >
        <Trash2 />
      </Button>
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-2xl border border-border bg-card transition-shadow duration-200',
        'animate-in fade-in duration-300',
        isDragging
          ? 'relative z-10 opacity-80 shadow-[0_20px_40px_-12px_rgb(0_0_0_/_0.25)]'
          : 'hover:shadow-[var(--edge-soft),0_2px_8px_-2px_rgb(0_0_0_/_0.08)]'
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          type="button"
          aria-label={t`Arrastar para reordenar`}
          className="cursor-grab touch-none rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing [&_svg]:size-4"
          {...attributes}
          {...listeners}
        >
          <GripVertical />
        </button>
        <span className="grid size-6 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
          {index + 1}
        </span>
        <Badge>{KIND_LABEL[question.kind]}</Badge>
        {update.isPending && (
          <span className="text-xs text-muted-foreground duration-200 animate-in fade-in">
            <Trans>Salvando…</Trans>
          </span>
        )}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={t`Excluir questão`}
          className="ml-auto"
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => save()}
          placeholder={t`Escreva o enunciado…`}
        />

        {/* Image */}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickImage}
        />
        {image ? (
          <div className="relative w-fit duration-200 animate-in fade-in zoom-in-95">
            <img
              src={image}
              alt={t`Imagem da questão`}
              className="max-h-48 rounded-xl border border-border"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              aria-label={t`Remover imagem`}
              className="absolute right-2 top-2"
              onClick={removeImage}
            >
              <X />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus />
            <Trans>Adicionar imagem</Trans>
          </Button>
        )}

        {/* Choice options (mcq = single correct via RadioGroup, multi = Checkbox) */}
        {isChoice && (
          <div className="space-y-2">
            {question.kind === 'mcq' ? (
              <RadioGroup
                value={options.find((o) => o.correct)?.id ?? ''}
                onValueChange={(id) => toggleCorrect(id)}
              >
                {options.map((o, i) =>
                  optionRow(
                    o,
                    i,
                    <RadioGroupItem value={o.id} aria-label={t`Marcar como correta`} />
                  )
                )}
              </RadioGroup>
            ) : (
              <div className="grid gap-2">
                {options.map((o, i) =>
                  optionRow(
                    o,
                    i,
                    <Checkbox
                      checked={o.correct}
                      onCheckedChange={() => toggleCorrect(o.id)}
                      aria-label={t`Marcar como correta`}
                    />
                  )
                )}
              </div>
            )}
            {options.length < 8 && (
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus />
                <Trans>Adicionar alternativa</Trans>
              </Button>
            )}
          </div>
        )}

        {/* True / false */}
        {question.kind === 'truefalse' && (
          <div className="flex gap-2">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => {
                  setTfAnswer(val)
                  save({ tfAnswer: val })
                }}
                className={cn(
                  'flex-1 rounded-[10px] border px-3 py-2 text-sm font-semibold transition-colors',
                  tfAnswer === val
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-input-border text-muted-foreground hover:bg-accent'
                )}
              >
                {val ? <Trans>Verdadeiro</Trans> : <Trans>Falso</Trans>}
              </button>
            ))}
          </div>
        )}

        {/* Code */}
        {question.kind === 'code' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                <Trans>Linguagem</Trans>
              </span>
              <Select
                value={language}
                onValueChange={(v) => {
                  const lang = v as CodeLanguage
                  setLanguage(lang)
                  save({ language: lang })
                }}
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CodeLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang === 'plaintext' ? t`Texto` : lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CodeEditor
              value={starterCode}
              language={language}
              onChange={setStarterCode}
              onBlur={() => save()}
            />
            <p className="text-xs text-muted-foreground">
              <Trans>Código inicial que o aluno verá. A correção é manual.</Trans>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <PointsField value={Number(points) || 0} onChange={setPointsValue} />
          {error && <span className="text-xs font-semibold text-destructive">{error}</span>}
        </div>
      </div>
    </div>
  )
}
