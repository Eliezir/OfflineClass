import { useState } from 'react'
import { Cloud, Loader2 } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/shared/ui/dialog'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { Segmented } from '@renderer/shared/ui/segmented'
import { useLinkAccount } from '../queries'

interface Props {
  trigger: React.ReactNode
  onLinked?: () => void
}

export function SyncLinkDialog({ trigger, onLinked }: Props): React.JSX.Element {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [connectorUrl, setConnectorUrl] = useState('http://localhost:3001')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutateAsync: link, isPending } = useLinkAccount()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    try {
      await link({ connectorUrl, email, password, mode })
      setOpen(false)
      onLinked?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t`Erro ao vincular conta`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Cloud className="size-5 text-primary" />
              <Trans>Vincular conta cloud</Trans>
            </div>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Conecte ao servidor de sincronização da sua instituição para ativar o backup na
              nuvem.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-1">
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as 'login' | 'register')}
            ariaLabel={t`Modo de autenticação`}
            fullWidth
            options={[
              { value: 'login', label: t`Entrar` },
              { value: 'register', label: t`Criar conta` }
            ]}
          />

          <div className="space-y-1.5">
            <Label htmlFor="connector-url">
              <Trans>URL do servidor</Trans>
            </Label>
            <Input
              id="connector-url"
              type="url"
              placeholder="http://servidor:3001"
              value={connectorUrl}
              onChange={(e) => setConnectorUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sync-email">
              <Trans>E-mail</Trans>
            </Label>
            <Input
              id="sync-email"
              type="email"
              placeholder="professor@escola.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sync-password">
              <Trans>Senha</Trans>
            </Label>
            <Input
              id="sync-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="rounded-[10px] bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              <Trans>Cancelar</Trans>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <Trans>Vincular</Trans>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
