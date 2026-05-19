import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { LoginInput } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '../lib/api'

export default function LoginRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = LoginInput.safeParse({ email, password })
      if (!parsed.success) {
        const first = parsed.error.issues[0]
        throw new Error(first?.message ?? 'Dados inválidos')
      }
      return api.auth.login(parsed.data)
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
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta de professor.</CardDescription>
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Não tem conta?{' '}
              <Link to="/register" className="text-foreground underline">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
