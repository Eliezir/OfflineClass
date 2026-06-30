import { useEffect, useState } from 'react'
import { ChevronDown, ExternalLink, KeyRound } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import { Button } from '@renderer/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/shared/ui/dialog'
import step1Img from '@renderer/assets/lottie/gmail-help/step1-2fa.png'
import step2EmptyImg from '@renderer/assets/lottie/gmail-help/step2-app-passwords.png'
import step2GeneratedImg from '@renderer/assets/lottie/gmail-help/step2-generated.png'

const SECURITY_URL = 'https://myaccount.google.com/security'
const APP_PASSWORDS_URL = 'https://myaccount.google.com/apppasswords'

function openExternal(url: string): void {
  window.open(url, '_blank')
}

/** Step-by-step guide for getting Gmail SMTP credentials (App Password). The
    steps form an accordion; the right panel illustrates the active step. */
export function GmailHelpDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): React.JSX.Element {
  const { t } = useLingui()
  const [active, setActive] = useState(1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <Trans>Como usar um Gmail para enviar as notas</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              O Gmail exige uma “Senha de app” (não a senha normal da conta). Gere a sua e preencha
              os campos com os valores do passo 3.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_350px] items-start">
          {/* Accordion steps */}
          <ol className="space-y-0">
            <StepItem
              n={1}
              active={active === 1}
              onClick={() => setActive(1)}
              title={t`Ative a verificação em duas etapas`}
            >
              <p>
                <Trans>
                  Abra a segurança da Conta Google e ative a verificação em duas etapas (2FA), caso
                  ainda não esteja ativa.
                </Trans>
              </p>
              <LinkButton label={t`Abrir segurança da conta`} url={SECURITY_URL} />
            </StepItem>

            <StepItem
              n={2}
              active={active === 2}
              onClick={() => setActive(2)}
              title={t`Gere uma Senha de app`}
            >
              <p>
                <Trans>O Google gera uma senha de 16 caracteres, como:</Trans>
              </p>
              <code className="mt-2 inline-block rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs tracking-wider text-foreground shadow-sm">
                abcd efgh ijkl mnop
              </code>
              <p className="mt-2">
                <Trans>
                  Essa <strong className="font-semibold text-foreground">não</strong> é a senha da
                  conta — é ela que vai no campo <strong>Senha</strong>.
                </Trans>
              </p>
              <LinkButton label={t`Abrir Senhas de app`} url={APP_PASSWORDS_URL} />
            </StepItem>

            <StepItem
              n={3}
              active={active === 3}
              onClick={() => setActive(3)}
              title={t`Preencha os campos`}
              isLast
            >
              <p>
                <Trans>
                  Use os valores ao lado e clique em “Testar conexão” antes de salvar.
                </Trans>
              </p>
            </StepItem>
          </ol>

          {/* Contextual visual for the active step */}
          <div className="flex items-center justify-center md:justify-end shrink-0">
            <aside className="relative w-[350px] h-[350px] overflow-hidden rounded-md border border-border bg-muted/40 p-4">
              {active === 1 && <SecurityMock />}
              {active === 2 && <AppPasswordVisual />}
              {active === 3 && <FieldsPanel />}
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepItem({
  n,
  active,
  onClick,
  title,
  children,
  isLast = false
}: {
  n: number
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  isLast?: boolean
}): React.JSX.Element {
  return (
    <li className="relative flex gap-4">
      {/* Indicator line & circle column */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className={cn(
            'grid size-7 place-items-center rounded-full text-xs font-bold z-10 transition-colors',
            active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {n}
        </span>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/65 my-1" />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 pb-5">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center justify-between py-0.5 text-left"
        >
          <span className={cn(
            "text-sm font-semibold transition-colors truncate",
            active ? "text-primary" : "text-foreground"
          )}>{title}</span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              active && 'rotate-180'
            )}
          />
        </button>
        {active && (
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">{children}</div>
        )}
      </div>
    </li>
  )
}

function LinkButton({ label, url }: { label: string; url: string }): React.JSX.Element {
  return (
    <Button variant="outline" size="sm" className="mt-2.5" onClick={() => openExternal(url)}>
      <ExternalLink className="size-3.5" />
      {label}
    </Button>
  )
}

/** Step 3 — the SMTP values to type into the form. */
function FieldsPanel(): React.JSX.Element {
  const renderField = (label: string, value: string) => (
    <div key={label} className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm text-foreground">{value}</dd>
    </div>
  )

  return (
    <div>
      <div className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        <Trans>Gmail (SSL)</Trans>
      </div>
      <dl className="flex flex-col gap-2.5">
        {renderField('Servidor (host)', 'smtp.gmail.com')}
        <div className="grid grid-cols-2 gap-4">
          {renderField('Porta', '465')}
          {renderField('SSL/TLS', 'Ligado')}
        </div>
        {renderField('Usuário', 'seuemail@gmail.com')}
        {renderField('Senha', 'Senha de app')}
        {renderField('Nome do remetente', 'Nome exibido ao aluno')}
        {renderField('E-mail do remetente', 'seuemail@gmail.com')}
      </dl>
    </div>
  )
}

/** Step 1 — screenshot of the Google "how you sign in" security screen. */
function SecurityMock(): React.JSX.Element {
  return <Shot src={step1Img} alt="Tela de segurança da Conta Google com a verificação em duas etapas" />
}

/** Step 2 — cross-fades between the empty "App passwords" screen and the
    generated-password screen. */
function AppPasswordVisual(): React.JSX.Element {
  const [shot, setShot] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setShot((v) => (v === 0 ? 1 : 0)), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full min-h-[300px]">
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: shot === 0 ? 1 : 0 }}
      >
        <Shot src={step2EmptyImg} alt="Tela de Senhas de app do Google" />
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: shot === 1 ? 1 : 0 }}
      >
        <Shot src={step2GeneratedImg} alt="Tela com a Senha de app gerada" />
      </div>
      <div className="absolute right-2 bottom-1 flex gap-1.5">
        <Dot on={shot === 0} />
        <Dot on={shot === 1} />
      </div>
    </div>
  )
}

function Shot({ src, alt }: { src: string; alt: string }): React.JSX.Element {
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full rounded-md border border-border bg-card object-cover object-top"
    />
  )
}

function Dot({ on }: { on: boolean }): React.JSX.Element {
  return <span className={cn('size-1.5 rounded-full', on ? 'bg-primary' : 'bg-border')} />
}
