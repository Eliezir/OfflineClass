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

  useEffect(() => {
    setPrompt(question.prompt)
    setError(null)
  }, [question.id])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setError(null)
    const parsed = EssayInput.safeParse({ kind: 'essay', prompt })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }
    onSave(parsed.data).catch((err: Error) => setError(err.message))
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
          required
        />
        <p className="text-muted-foreground text-xs">
          Os alunos respondem em campo livre. Sem correção automática.
        </p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar questão'}
        </Button>
      </div>
    </form>
  )
}
