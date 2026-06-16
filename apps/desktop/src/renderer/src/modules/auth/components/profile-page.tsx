import { useState } from 'react'
import { Check, Pencil, UserRound, X } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { UpdateProfileInput } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { PageHeader } from '@renderer/shared/components/page-header'
import { notify } from '@renderer/shared/services/toast'
import { SettingsSection } from '@renderer/modules/settings/components/settings-section'
import { initials } from '../initials'
import { useMe, useUpdateProfile } from '../queries'
import { ChangePasswordDialog } from './change-password-dialog'

type FieldErrors = { name?: string; email?: string }

/** A stacked field: small muted label with its value (or input) directly below,
    so the two never drift apart across the card's width. */
function Field({
  label,
  children,
  className
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  )
}

export function ProfilePage(): React.JSX.Element | null {
  const { t } = useLingui()
  const { data: me } = useMe()
  const update = useUpdateProfile()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  if (!me) return null

  // While editing, the banner mirrors the draft so it reads as a live preview.
  const shownName = (editing ? name : me.name) || me.name
  const shownEmail = (editing ? email : me.email) || me.email

  const startEdit = (): void => {
    setName(me.name)
    setEmail(me.email)
    setErrors({})
    setEditing(true)
  }

  const cancel = (): void => {
    setEditing(false)
    setErrors({})
  }

  async function save(): Promise<void> {
    const parsed = UpdateProfileInput.safeParse({ name: name.trim(), email: email.trim() })
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if ((field === 'name' || field === 'email') && !next[field]) next[field] = issue.message
      }
      return setErrors(next)
    }
    try {
      await update.mutateAsync(parsed.data)
      notify.success(t`Perfil atualizado.`)
      setEditing(false)
      setErrors({})
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t`Não foi possível salvar.`)
    }
  }

  return (
    <main className="@container scrollbar-subtle flex-1 overflow-y-auto px-6 pb-10">
      <PageHeader
        title={<Trans>Perfil</Trans>}
        subtitle={<Trans>Seus dados de professor.</Trans>}
      />

      <SettingsSection
        icon={UserRound}
        title={t`Conta`}
        description={t`Informações da sua conta no OfflineClass.`}
      >
        <div className="flex flex-col gap-8 px-6 py-6 @lg:flex-row">
          {/* Identity column — also a live preview while editing. */}
          <div className="flex shrink-0 flex-col items-center gap-3 text-center @lg:w-56 @lg:border-r @lg:border-border/60 @lg:pr-8">
            <span className="grid size-24 shrink-0 place-items-center rounded-full bg-primary-soft text-3xl font-bold text-primary">
              {initials(shownName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-foreground">{shownName}</p>
              <p className="truncate text-sm text-muted-foreground">{shownEmail}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                <Trans>Professor · OfflineClass</Trans>
              </p>
            </div>
          </div>

          {/* Fields column. */}
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex justify-end gap-2">
              {editing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={cancel} disabled={update.isPending}>
                    <X />
                    <Trans>Cancelar</Trans>
                  </Button>
                  <Button size="sm" onClick={save} disabled={update.isPending}>
                    <Check />
                    <Trans>Salvar</Trans>
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="sm" onClick={startEdit}>
                  <Pencil />
                  <Trans>Editar</Trans>
                </Button>
              )}
            </div>

            <dl className="grid gap-x-8 gap-y-6 @md:grid-cols-2">
              <Field label={<Trans>Nome</Trans>}>
                {editing ? (
                  <>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder={t`Seu nome`}
                      aria-invalid={!!errors.name}
                      autoFocus
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs font-semibold text-destructive">{errors.name}</p>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-foreground">{me.name}</span>
                )}
              </Field>

              <Field label={<Trans>E-mail</Trans>}>
                {editing ? (
                  <>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="voce@escola.com"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs font-semibold text-destructive">{errors.email}</p>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-foreground">{me.email}</span>
                )}
              </Field>

              <Field label={<Trans>Senha</Trans>} className="@md:col-span-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tracking-widest text-muted-foreground">
                    ••••••••
                  </span>
                  <ChangePasswordDialog />
                </div>
              </Field>
            </dl>
          </div>
        </div>
      </SettingsSection>
    </main>
  )
}
