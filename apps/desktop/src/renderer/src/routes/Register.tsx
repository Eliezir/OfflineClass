import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterInput } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '../lib/api'

export default function RegisterRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = RegisterInput.safeParse({ name, email, password })
      if (!parsed.success) {
        const first = parsed.error.issues[0]
        throw new Error(first?.message ?? 'Dados inválidos')
      }
      return api.auth.register(parsed.data)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/', { replace: true })
    },
    onError: (err: Error) => setFieldError(err.message)
  })

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Registre-se para aplicar provas no OfflineClass.</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setFieldError(null)
            mutation.mutate()
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">Mínimo 8 caracteres.</p>
            </div>
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Criando…' : 'Criar conta'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Já tem conta?{' '}
              <Link to="/login" className="text-foreground underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
