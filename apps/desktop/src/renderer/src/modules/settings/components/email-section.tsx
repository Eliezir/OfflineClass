import { useState } from 'react'
import { Loader2, Mail, Plug, Save } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { EmailSettingsInput, type EmailSettings } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { Switch } from '@renderer/shared/ui/switch'
import { notify } from '@renderer/shared/services/toast'
import {
  useEmailSettingsQuery,
  useSaveEmailSettings,
  useTestEmailSettings
} from '../email-settings'
import { SettingsSection } from './settings-section'

type FormState = {
  host: string
  port: string
  secure: boolean
  username: string
  password: string
  fromName: string
  fromEmail: string
}

function toForm(s: EmailSettings | null): FormState {
  if (!s) {
    return {
      host: '',
      port: '587',
      secure: false,
      username: '',
      password: '',
      fromName: '',
      fromEmail: ''
    }
  }
  return {
    host: s.host,
    port: String(s.port),
    secure: s.secure,
    username: s.username,
    password: s.password,
    fromName: s.fromName,
    fromEmail: s.fromEmail
  }
}

export function EmailSection(): React.JSX.Element {
  const { t } = useLingui()
  const query = useEmailSettingsQuery()

  // Render the form only once the stored config has loaded, so it can seed its
  // own state via the useState initializer (no setState-in-effect).
  return (
    <SettingsSection
      icon={Mail}
      title={t`E-mail`}
      description={t`Servidor SMTP usado para enviar as notas aos alunos após a prova.`}
    >
      {query.isLoading ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <EmailForm initial={query.data ?? null} />
      )}
    </SettingsSection>
  )
}

function EmailForm({ initial }: { initial: EmailSettings | null }): React.JSX.Element {
  const { t } = useLingui()
  const save = useSaveEmailSettings()
  const test = useTestEmailSettings()

  const [form, setForm] = useState<FormState>(() => toForm(initial))

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void =>
    setForm((prev) => ({ ...prev, [key]: value }))

  function parse(): EmailSettingsInput | null {
    const res = EmailSettingsInput.safeParse({ ...form, port: Number(form.port) })
    if (!res.success) {
      notify.error(res.error.issues[0]?.message ?? t`Dados inválidos`)
      return null
    }
    return res.data
  }

  function handleSave(): void {
    const input = parse()
    if (!input) return
    save.mutate(input, {
      onSuccess: () => notify.success(t`Configurações de e-mail salvas.`),
      onError: (err) => notify.error(err.message)
    })
  }

  function handleTest(): void {
    const input = parse()
    if (!input) return
    test.mutate(input, {
      onSuccess: (r) =>
        r.ok
          ? notify.success(t`Conexão bem-sucedida!`)
          : notify.error(t`Falha na conexão: ${r.error ?? ''}`),
      onError: (err) => notify.error(err.message)
    })
  }

  return (
    <SettingsSection
      icon={Mail}
      title={t`E-mail`}
      description={t`Servidor SMTP usado para enviar as notas aos alunos após a prova.`}
    >
      <div className="grid gap-x-6 gap-y-4 p-5 @2xl:grid-cols-2">
        <Field className="@2xl:col-span-2" label={t`Servidor (host)`}>
          <Input
            value={form.host}
            placeholder="smtp.gmail.com"
            onChange={(e) => set('host', e.target.value)}
          />
        </Field>

        <Field label={t`Porta`}>
          <Input
            type="number"
            value={form.port}
            placeholder="587"
            onChange={(e) => set('port', e.target.value)}
          />
        </Field>

        <div className="flex items-end justify-between gap-3 pb-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">
              <Trans>Conexão segura (SSL/TLS)</Trans>
            </div>
            <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
              <Trans>Ligue para a porta 465; desligue para 587 (STARTTLS).</Trans>
            </p>
          </div>
          <Switch
            checked={form.secure}
            onCheckedChange={(v) => set('secure', v)}
            aria-label={t`Conexão segura`}
          />
        </div>

        <Field label={t`Usuário`}>
          <Input
            value={form.username}
            autoComplete="off"
            placeholder={t`seu-usuario@exemplo.com`}
            onChange={(e) => set('username', e.target.value)}
          />
        </Field>

        <Field label={t`Senha`}>
          <Input
            type="password"
            value={form.password}
            autoComplete="new-password"
            placeholder="••••••••"
            onChange={(e) => set('password', e.target.value)}
          />
        </Field>

        <Field label={t`Nome do remetente`}>
          <Input
            value={form.fromName}
            placeholder={t`Prof. Fulano`}
            onChange={(e) => set('fromName', e.target.value)}
          />
        </Field>

        <Field label={t`E-mail do remetente`}>
          <Input
            type="email"
            value={form.fromEmail}
            placeholder="prof@escola.edu.br"
            onChange={(e) => set('fromEmail', e.target.value)}
          />
        </Field>

        <p className="text-xs text-pretty text-muted-foreground @2xl:col-span-2">
          <Trans>
            Dica: no Gmail, use uma “Senha de app” (não a senha normal da conta). O envio exige
            internet — é uma ação pós-prova.
          </Trans>
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={test.isPending}>
          {test.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plug className="size-3.5" />
          )}
          <Trans>Testar conexão</Trans>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          <Trans>Salvar</Trans>
        </Button>
      </div>
    </SettingsSection>
  )
}

function Field({
  label,
  className,
  children
}: {
  label: string
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
  )
}
