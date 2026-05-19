import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { api } from '../../lib/api'

export default function NewSessionRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: active, isPending: activePending } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: api.sessions.active
  })

  // If there's already an active session, bounce the teacher there.
  useEffect(() => {
    if (active) navigate(`/sessions/${active.id}`, { replace: true })
  }, [active, navigate])

  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: api.exams.list })

  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [duration, setDuration] = useState(60)
  const [allowLate, setAllowLate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedExam) throw new Error('Selecione uma prova')
      return api.sessions.create({
        examId: selectedExam,
        durationMinutes: duration,
        allowLateJoin: allowLate
      })
    },
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['sessions', 'active'] })
      navigate(`/sessions/${session.id}`)
    },
    onError: (err: Error) => setError(err.message)
  })

  if (activePending) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <p className="text-muted-foreground text-sm">Verificando sessão ativa…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-10">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          <Link to="/">← Início</Link>
        </p>
        <h1 className="text-3xl font-semibold">Nova sessão</h1>
        <p className="text-muted-foreground text-sm">
          Escolha a prova, defina o tempo e abra o lobby para os alunos entrarem.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Prova</h2>
        {exams && exams.length === 0 && (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              Você ainda não tem provas. <Link to="/exams" className="underline">Criar uma</Link>.
            </CardContent>
          </Card>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {exams?.map((exam) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => setSelectedExam(exam.id)}
              className={cn(
                'border-border bg-card hover:bg-muted/60 rounded-lg border p-4 text-left transition',
                selectedExam === exam.id && 'border-ring ring-ring/40 ring-2'
              )}
            >
              <p className="font-medium">{exam.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {exam.questionsCount} {exam.questionsCount === 1 ? 'questão' : 'questões'}
              </p>
            </button>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Duração e regras de entrada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value || 0)))}
              className="w-32"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
              className="size-4"
            />
            Permitir alunos entrarem após o início
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <footer className="flex items-center justify-end gap-3">
        <Button asChild variant="outline">
          <Link to="/">Cancelar</Link>
        </Button>
        <Button
          onClick={() => {
            setError(null)
            mutation.mutate()
          }}
          disabled={!selectedExam || mutation.isPending}
        >
          {mutation.isPending ? 'Criando…' : 'Abrir lobby'}
        </Button>
      </footer>
    </main>
  )
}
