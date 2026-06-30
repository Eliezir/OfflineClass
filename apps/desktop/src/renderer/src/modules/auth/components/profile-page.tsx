import { useRef, useState } from 'react'
import { Check, Pencil, Smile, Trash2, UserRound, X } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { type AvatarConfig, UpdateProfileInput } from '@offlineclass/shared'
import { Avatar, AvatarBuilder, randomAvatar } from '@offlineclass/avatar'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { PageHeader } from '@renderer/shared/components/page-header'
import { notify } from '@renderer/shared/services/toast'
import { SettingsSection } from '@renderer/modules/settings/components/settings-section'
import { cn } from '@renderer/shared/utils'
import { initials } from '../initials'
import { useMe, useUpdateAvatar, useUpdateProfile } from '../queries'
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
  const updateAvatar = useUpdateAvatar()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  // `avatarDraft` holds the working avatar (kept mounted through the collapse
  // animation); `editorOpen` drives the expand/collapse transition.
  const [avatarDraft, setAvatarDraft] = useState<AvatarConfig | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  if (!me) return null

  async function saveAvatar(next: AvatarConfig | null): Promise<void> {
    try {
      await updateAvatar.mutateAsync(next)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t`Não foi possível salvar.`)
    }
  }

  function openAvatarEditor(): void {
    setAvatarDraft(me!.avatar ?? randomAvatar())
    setEditorOpen(true)
    // Scroll the panel into view so it isn't missed below the fold.
    requestAnimationFrame(() =>
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }

  function closeAvatarEditor(): void {
    setEditorOpen(false)
    // Keep the builder mounted until the collapse animation finishes.
    window.setTimeout(() => setAvatarDraft(null), 300)
  }

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
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={openAvatarEditor}
                aria-label={me.avatar ? t`Trocar avatar` : t`Escolher avatar`}
                className="group relative rounded-full transition active:scale-95"
              >
                {me.avatar ? (
                  <Avatar config={me.avatar} size={96} />
                ) : (
                  <span className="grid size-24 shrink-0 place-items-center rounded-full bg-primary-soft text-3xl font-bold text-primary">
                    {initials(shownName)}
                  </span>
                )}
                <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow transition group-hover:bg-primary/90">
                  <Pencil className="size-3.5" />
                </span>
              </button>
              {me.avatar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void saveAvatar(null)}
                  disabled={updateAvatar.isPending}
                >
                  <Trash2 />
                  <Trans>Remover avatar</Trans>
                </Button>
              )}
            </div>
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

      {/* Editor panel: grid-rows 0fr→1fr animates the height both ways. */}
      <div
        ref={editorRef}
        className={cn(
          'grid scroll-mt-6 transition-[grid-template-rows,margin-top,opacity] duration-300 ease-out',
          editorOpen ? 'mt-6 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {avatarDraft && (
            <SettingsSection
              icon={Smile}
              title={t`Avatar`}
              description={t`Personalize seu avatar de professor.`}
            >
              <div className="h-[min(70vh,560px)]">
                <AvatarBuilder
                  value={avatarDraft}
                  onChange={setAvatarDraft}
                  onDone={() => {
                    void saveAvatar(avatarDraft)
                    closeAvatarEditor()
                  }}
                  onClose={closeAvatarEditor}
                />
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </main>
  )
}
