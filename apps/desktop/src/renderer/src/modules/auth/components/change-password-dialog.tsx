import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { ChangePasswordInput } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/shared/ui/dialog'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { notify } from '@renderer/shared/services/toast'
import { useChangePassword } from '../queries'

/** "Alterar senha" — opens a dialog with current/new/confirm fields. Confirm is
    a UI-only check; the rest validates against the shared ChangePasswordInput. */
export function ChangePasswordDialog(): React.JSX.Element {
  const { t } = useLingui()
  const change = useChangePassword()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = (): void => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setShow(false)
    setError(null)
  }

  const onOpenChange = (value: boolean): void => {
    setOpen(value)
    if (!value) reset()
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    const parsed = ChangePasswordInput.safeParse({ currentPassword: current, newPassword: next })
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
    if (next !== confirm) return setError(t`As senhas não coincidem.`)
    try {
      await change.mutateAsync(parsed.data)
      notify.success(t`Senha alterada.`)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t`Não foi possível alterar a senha.`)
    }
  }

  const inputType = show ? 'text' : 'password'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <KeyRound />
          <Trans>Alterar senha</Trans>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans>Alterar senha</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Informe a senha atual e escolha uma nova.</Trans>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pwd-current">
              <Trans>Senha atual</Trans>
            </Label>
            <Input
              id="pwd-current"
              type={inputType}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pwd-new">
              <Trans>Nova senha</Trans>
            </Label>
            <div className="relative">
              <Input
                id="pwd-new"
                type={inputType}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder={t`Mínimo 8 caracteres`}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? t`Ocultar senha` : t`Mostrar senha`}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pwd-confirm">
              <Trans>Confirmar nova senha</Trans>
            </Label>
            <Input
              id="pwd-confirm"
              type={inputType}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                <Trans>Cancelar</Trans>
              </Button>
            </DialogClose>
            <Button type="submit" disabled={change.isPending}>
              <Trans>Salvar senha</Trans>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
