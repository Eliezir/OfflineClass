import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { useNavigate } from '@tanstack/react-router'
import { LoginInput, RegisterInput } from '@offlineclass/shared'
import logo from '@renderer/shared/assets/logo-icon.png'
import hero from '@renderer/shared/assets/auth-hero.png'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginM = useLogin()
  const registerM = useRegister()
  const pending = loginM.isPending || registerM.isPending
  const isRegister = mode === 'register'

  const switchMode = (next: Mode): void => {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    try {
      if (isRegister) {
        const parsed = RegisterInput.safeParse({ email, name, password })
        if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
        await registerM.mutateAsync(parsed.data)
      } else {
        const parsed = LoginInput.safeParse({ email, password })
        if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
        await loginM.mutateAsync(parsed.data)
      }
      await navigate({ to: '/home' })
    } catch (err) {
      setError(authErrorMessage(err, t`Não foi possível continuar.`))
    }
  }

  return (
    <div className="relative flex h-screen flex-col bg-canvas text-foreground">
      <header
        className="flex h-12 shrink-0 items-center justify-end px-3"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <WindowControls />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-10">
        <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          {/* Brand panel — collapses on narrow widths. */}
          <aside className="relative hidden w-[44%] shrink-0 md:block">
            <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30" />

            <div className="absolute left-6 top-6 flex items-center gap-2">
              <img src={logo} alt="" className="size-7 drop-shadow" />
              <span className="font-display text-lg font-bold text-white drop-shadow">
                Offline<span className="text-primary-foreground/90">Class</span>
              </span>
            </div>

            <p className="absolute bottom-7 left-6 right-6 font-display text-2xl font-bold leading-tight text-white drop-shadow-md">
              <Trans>
                Provas em grupo,
                <br />
                ao vivo, sem internet.
              </Trans>
            </p>
          </aside>

          {/* Form panel. */}
          <div className="flex w-full flex-col justify-center gap-6 p-8 md:w-[56%] md:p-10">
            <div className="space-y-1">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {isRegister ? <Trans>Criar sua conta</Trans> : <Trans>Bem-vindo de volta</Trans>}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRegister ? (
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
                ) : (
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
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
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
                  autoFocus={!isRegister}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-password">
                  <Trans>Senha</Trans>
                </Label>
                <div className="relative">
                  <Input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? t`Mínimo 8 caracteres` : '••••••••'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t`Ocultar senha` : t`Mostrar senha`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {isRegister ? <Trans>Criar conta</Trans> : <Trans>Entrar</Trans>}
                <ArrowRight />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
