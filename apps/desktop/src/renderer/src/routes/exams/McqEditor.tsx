import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { McqInput, type McqOption, type McqQuestion } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  question: McqQuestion
  onSave: (input: McqInput) => Promise<unknown>
  isSaving: boolean
}

function newOption(text = ''): McqOption {
  return { id: crypto.randomUUID(), text, correct: false }
}

export default function McqEditor({ question, onSave, isSaving }: Props): React.JSX.Element {
  const [prompt, setPrompt] = useState(question.prompt)
  const [options, setOptions] = useState<McqOption[]>(question.options)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  // When the user selects a different question, swap state in.
  useEffect(() => {
    setPrompt(question.prompt)
    setOptions(question.options)
    setError(null)
    setSavedFlash(false)
  }, [question.id])

  const correctId = options.find((o) => o.correct)?.id ?? null

  const updateOption = (id: string, patch: Partial<McqOption>): void => {
    setOptions((cur) => cur.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  const removeOption = (id: string): void => {
    setOptions((cur) => cur.filter((o) => o.id !== id))
  }

  const addOption = (): void => {
    setOptions((cur) => [...cur, newOption()])
  }

  const setCorrect = (id: string): void => {
    setOptions((cur) => cur.map((o) => ({ ...o, correct: o.id === id })))
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setError(null)
    setSavedFlash(false)
    const draft: unknown = { kind: 'mcq', prompt, options }
    const parsed = McqInput.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }
    onSave(parsed.data)
      .then(() => {
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2000)
      })
      .catch((err: Error) => setError(err.message))
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`prompt-${question.id}`}>Enunciado</Label>
        <Textarea
          id={`prompt-${question.id}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Opções</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus /> Opção
          </Button>
        </div>

        <RadioGroup value={correctId ?? undefined} onValueChange={setCorrect}>
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
              <Input
                value={opt.text}
                onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remover opção"
                onClick={() => removeOption(opt.id)}
                disabled={options.length <= 2}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </RadioGroup>
        <p className="text-muted-foreground text-xs">
          Marque a opção correta no botão à esquerda. Mínimo 2, máximo 8 opções.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {savedFlash && <span className="text-muted-foreground text-sm">Salvo ✓</span>}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar questão'}
        </Button>
      </div>
    </form>
  )
}
