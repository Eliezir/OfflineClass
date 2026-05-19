import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { JoinInput } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '../lib/api'
import { saveToken } from '../lib/session'

export default function JoinRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [matricula, setMatricula] = useState('')
  const [error, setError] = useState<string | null>(null)

  const active = useQuery({
    queryKey: ['session', 'active'],
    queryFn: api.sessionActive,
    retry: false
  })

  const mutation = useMutation({
    mutationFn: () => {
      const parsed = JoinInput.safeParse({ name, matricula })
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }
      return api.join(parsed.data)
    },
    onSuccess: (res) => {
      saveToken(res.token)
      if (res.status === 'running') navigate('/test', { replace: true })
      else navigate('/waiting', { replace: true })
    },
    onError: (err: Error) => setError(err.message)
  })

  // If there's no active session, the student is too early or too late.
  const noSession = active.isError && (active.error as Error & { status?: number })?.status === 404

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>OfflineClass</CardTitle>
          <CardDescription>
            {noSession
              ? 'Nenhuma sessão ativa neste momento.'
              : active.data
                ? `Prova: ${active.data.examTitle}`
                : 'Conectando…'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {noSession ? (
            <p className="text-muted-foreground text-sm">
              Espere o professor abrir o lobby e recarregue esta página.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                mutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending || !active.data}
              >
                {mutation.isPending ? 'Entrando…' : 'Entrar na prova'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
