import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { useNavigate } from '@tanstack/react-router'
import { LoginInput, RegisterInput } from '@offlineclass/shared'
import logo from '@renderer/shared/assets/logo-icon.png'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { Segmented } from '@renderer/shared/ui/segmented'
import { useTheme } from '@renderer/shared/hooks/use-theme'
import { WindowControls } from '@renderer/shared/layouts/window-controls'
import { useLogin, useRegister } from '../queries'

type Mode = 'login' | 'register'

/** Strips Electron's "Error invoking remote method '…': AuthError: " wrapper,
    leaving the human message the main process threw (already in PT-BR). */
function authErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  const parts = raw.split(': ')
  return parts[parts.length - 1]?.trim() || fallback
}

export function AuthPage(): React.JSX.Element {
  const { t } = useLingui()
  const navigate = useNavigate()
  // Auth lives outside the _app shell, so it owns applying the theme.
  useTheme()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loginM = useLogin()
  const registerM = useRegister()
  const pending = loginM.isPending || registerM.isPending

  const switchMode = (next: Mode): void => {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        const parsed = LoginInput.safeParse({ email, password })
        if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
        await loginM.mutateAsync(parsed.data)
      } else {
        const parsed = RegisterInput.safeParse({ email, name, password })
        if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
        await registerM.mutateAsync(parsed.data)
      }
      await navigate({ to: '/home' })
    } catch (err) {
      setError(authErrorMessage(err, t`Não foi possível continuar.`))
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-canvas text-foreground">
      <header
        className="flex h-14 shrink-0 items-center justify-end px-3"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <WindowControls />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-14">
        <div className="relative w-full max-w-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-1/2 size-44 -translate-x-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, oklch(0.58 0.19 270 / 0.35), transparent 70%)',
              filter: 'blur(34px)'
            }}
          />

          <div className="relative flex flex-col items-center gap-2 text-center">
            <img src={logo} alt="OfflineClass" className="size-16 drop-shadow-sm" />
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {mode === 'login' ? <Trans>Bem-vindo de volta</Trans> : <Trans>Criar sua conta</Trans>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? (
                <Trans>Entre para gerenciar suas provas.</Trans>
              ) : (
                <Trans>Leva menos de um minuto.</Trans>
              )}
            </p>
          </div>

          <div className="relative mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--edge-soft)]">
            <Segmented
              fullWidth
              ariaLabel={t`Entrar ou criar conta`}
              value={mode}
              onChange={(v) => switchMode(v as Mode)}
              disabled={pending}
              options={[
                { value: 'login', label: t`Entrar` },
                { value: 'register', label: t`Criar conta` }
              ]}
            />

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">
                    <Trans>Nome</Trans>
                  </Label>
                  <Input
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t`Como devemos te chamar?`}
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email">
                  <Trans>E-mail</Trans>
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@escola.com"
                  autoFocus={mode === 'login'}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-password">
                  <Trans>Senha</Trans>
                </Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? t`Mínimo 8 caracteres` : '••••••••'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {mode === 'login' ? <Trans>Entrar</Trans> : <Trans>Criar conta</Trans>}
                <ArrowRight />
              </Button>
            </form>
          </div>

          <p className="relative mt-5 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                <Trans>Não tem conta?</Trans>{' '}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => switchMode('register')}
                >
                  <Trans>Criar conta</Trans>
                </button>
              </>
            ) : (
              <>
                <Trans>Já tem conta?</Trans>{' '}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => switchMode('login')}
                >
                  <Trans>Entrar</Trans>
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
