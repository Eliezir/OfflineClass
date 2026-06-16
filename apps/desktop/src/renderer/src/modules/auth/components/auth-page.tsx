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

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

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
    <div className="relative flex h-screen bg-canvas text-foreground" style={dragRegion}>
      {/* Window controls float over the canvas; on macOS the traffic lights
          sit top-left over the form's empty top space. */}
      <div className="absolute right-3 top-3 z-10" style={noDragRegion}>
        <WindowControls />
      </div>

      {/* Form panel (left). */}
      <div
        className="flex w-full flex-col justify-center px-8 md:w-[45%] md:px-14 lg:px-20"
        style={noDragRegion}
      >
        <div className="mx-auto w-full max-w-sm">
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

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
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

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
              {isRegister ? <Trans>Criar conta</Trans> : <Trans>Entrar</Trans>}
              <ArrowRight />
            </Button>
          </form>
        </div>
      </div>

      {/* Brand panel (right) — image inset with padding so the canvas shows around it. */}
      <aside className="hidden p-4 md:block md:w-[55%]">
        <div className="relative size-full overflow-hidden rounded-3xl">
          <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30" />

          <div className="absolute left-6 top-6 flex items-center gap-2">
            <img src={logo} alt="" className="size-7 drop-shadow" />
            <span className="font-display text-lg font-bold text-white drop-shadow">
              Offline<span className="text-primary-foreground/90">Class</span>
            </span>
          </div>

          <p className="absolute bottom-7 left-7 right-7 font-display text-3xl font-bold leading-tight text-white drop-shadow-md">
            <Trans>
              Provas em grupo,
              <br />
              ao vivo, sem internet.
            </Trans>
          </p>
        </div>
      </aside>
    </div>
  )
}
