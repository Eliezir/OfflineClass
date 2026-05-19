import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '../../lib/api'

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ExamListRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: exams, isPending } = useQuery({
    queryKey: ['exams'],
    queryFn: api.exams.list
  })

  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => api.exams.create({ title: newTitle, description: newDesc || null }),
    onSuccess: (exam) => {
      setNewOpen(false)
      setNewTitle('')
      setNewDesc('')
      setError(null)
      qc.invalidateQueries({ queryKey: ['exams'] })
      navigate(`/exams/${exam.id}`)
    },
    onError: (err: Error) => setError(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.exams.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] })
  })

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.exams.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] })
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            <Link to="/">← Início</Link>
          </p>
          <h1 className="text-3xl font-semibold">Provas</h1>
          <p className="text-muted-foreground text-sm">
            Crie, edite e duplique suas provas. Aplicar uma sessão vem no Stage 3.
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>Nova prova</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova prova</DialogTitle>
              <DialogDescription>
                Título e descrição agora; as questões você adiciona em seguida.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                if (newTitle.trim().length === 0) {
                  setError('Título obrigatório')
                  return
                }
                createMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="new-title">Título</Label>
                <Input
                  id="new-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-desc">Descrição (opcional)</Label>
                <Textarea
                  id="new-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando…' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {isPending && <p className="text-muted-foreground text-sm">Carregando…</p>}

      {exams && exams.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Nenhuma prova ainda. Clique em <strong>Nova prova</strong> para começar.
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {exams?.map((exam) => (
          <Card key={exam.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate">{exam.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {exam.description ?? <span className="italic">Sem descrição</span>}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Mais opções">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(exam.id)}>
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm(`Apagar "${exam.title}"? Esta ação é irreversível.`)) {
                          deleteMutation.mutate(exam.id)
                        }
                      }}
                      variant="destructive"
                    >
                      Apagar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground flex-1 text-sm">
              {exam.questionsCount} {exam.questionsCount === 1 ? 'questão' : 'questões'} ·
              atualizada em {formatDate(exam.updatedAt)}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/exams/${exam.id}`}>Editar</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </main>
  )
}
