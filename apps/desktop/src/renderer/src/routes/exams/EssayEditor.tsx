import { useEffect, useState } from 'react'
import { EssayInput, type EssayQuestion } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  question: EssayQuestion
  onSave: (input: EssayInput) => Promise<unknown>
  isSaving: boolean
}

export default function EssayEditor({ question, onSave, isSaving }: Props): React.JSX.Element {
  const [prompt, setPrompt] = useState(question.prompt)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setPrompt(question.prompt)
    setError(null)
    setSavedFlash(false)
  }, [question.id])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setError(null)
    setSavedFlash(false)
    const parsed = EssayInput.safeParse({ kind: 'essay', prompt })
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
        <Label htmlFor={`essay-${question.id}`}>Enunciado</Label>
        <Textarea
          id={`essay-${question.id}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
        />
        <p className="text-muted-foreground text-xs">
          Os alunos respondem em campo livre. Sem correção automática.
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
