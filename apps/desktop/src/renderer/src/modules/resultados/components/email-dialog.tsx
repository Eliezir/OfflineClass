import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, Mail, Send, UserCircle, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import type { EmailSendResult } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { Checkbox } from '@renderer/shared/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/shared/ui/dialog'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { Textarea } from '@renderer/shared/ui/textarea'
import { notify } from '@renderer/shared/services/toast'
import { useSlowActionToast } from '@renderer/shared/hooks/use-slow-action-toast'
import { cn, maskEmail } from '@renderer/shared/utils'
import { useEmailSettingsQuery } from '@renderer/modules/settings/email-settings'
import { useEmailResults, useSetStudentEmail } from '../queries'
import type { StudentResult } from '../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type EmailDialogProps = {
  sessionId: string
  examTitle: string
  examSubject: string | null
  students: StudentResult[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Shell only — the body is a child of DialogContent so it remounts (and its
    state re-seeds from `students`) each time the dialog opens. */
export function EmailDialog({
  sessionId,
  examTitle,
  examSubject,
  students,
  open,
  onOpenChange
}: EmailDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <EmailDialogBody
          sessionId={sessionId}
          examTitle={examTitle}
          examSubject={examSubject}
          students={students}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function EmailDialogBody({
  sessionId,
  examTitle,
  examSubject,
  students,
  onClose
}: {
  sessionId: string
  examTitle: string
  examSubject: string | null
  students: StudentResult[]
  onClose: () => void
}): React.JSX.Element {
  const { t } = useLingui()
  const settings = useEmailSettingsQuery()
  const setEmail = useSetStudentEmail(sessionId)
  const send = useEmailResults(sessionId)

  // Default subject/message — the teacher edits them, but they must not be empty.
  const discipline = examSubject?.trim() || null
  const defaultSubject = `Sua nota — ${discipline ? `${discipline} · ` : ''}${examTitle}`
  const defaultMessage = discipline
    ? t`Segue o resultado da sua prova de ${discipline} (${examTitle}). Confira sua nota e os comentários por questão abaixo.`
    : t`Segue o resultado da sua prova ${examTitle}. Confira sua nota e os comentários por questão abaixo.`

  // Initializers run on each (re)mount — i.e. each time the dialog opens.
  const [emails, setEmails] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.studentId, s.email ?? '']))
  )
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(students.map((s) => [s.studentId, !!s.email]))
  )
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(defaultMessage)
  const [results, setResults] = useState<EmailSendResult[] | null>(null)

  const configured = !!settings.data
  const sending = send.isPending || setEmail.isPending

  useSlowActionToast(
    sending,
    t`Enviando pelo servidor de e-mail… Se demorar, confira host, porta/conexão segura e use uma Senha de app do Gmail.`,
    { id: 'email-send' }
  )
  const selectedCount = useMemo(
    () => students.filter((s) => selected[s.studentId]).length,
    [students, selected]
  )

  async function handleSend(): Promise<void> {
    const chosen = students.filter((s) => selected[s.studentId])
    if (chosen.length === 0) {
      notify.warning(t`Selecione ao menos um aluno.`)
      return
    }
    if (!subject.trim()) {
      notify.warning(t`Informe o assunto do e-mail.`)
      return
    }
    if (!message.trim()) {
      notify.warning(t`Informe a mensagem de abertura.`)
      return
    }

    // Persist any e-mails the teacher edited before sending (the backend reads
    // them from the DB).
    for (const s of chosen) {
      const email = (emails[s.studentId] ?? '').trim()
      const original = s.email ?? ''
      if (email === original) continue
      if (email !== '' && !EMAIL_RE.test(email)) {
        notify.error(t`E-mail inválido para ${s.name}.`)
        return
      }
      try {
        await setEmail.mutateAsync({ studentId: s.studentId, email })
      } catch (err) {
        notify.error(err instanceof Error ? err.message : String(err))
        return
      }
    }

    try {
      const res = await send.mutateAsync({
        studentIds: chosen.map((s) => s.studentId),
        subject: subject.trim(),
        message: message.trim()
      })
      setResults(res)
      const ok = res.filter((r) => r.ok).length
      if (ok === res.length) notify.success(t`${ok} e-mail(s) enviado(s) com sucesso.`)
      else notify.warning(t`${ok} de ${res.length} e-mail(s) enviado(s).`)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          <Trans>Enviar notas por e-mail</Trans>
        </DialogTitle>
        <DialogDescription>{examTitle}</DialogDescription>
      </DialogHeader>

      {!configured && !settings.isLoading && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">
              <Trans>E-mail (SMTP) ainda não configurado.</Trans>
            </p>
            <p className="text-muted-foreground">
              <Trans>Configure o servidor de e-mail em</Trans>{' '}
              <Link
                to="/settings"
                className="font-bold text-primary underline-offset-2 hover:underline"
                onClick={onClose}
              >
                <Trans>Configurações</Trans>
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {results ? (
        <ResultsView results={results} />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Subject + intro message */}
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email-subject">
                <Trans>Assunto do e-mail</Trans>
              </Label>
              <Input
                id="email-subject"
                value={subject}
                placeholder={t`Assunto do e-mail`}
                aria-invalid={!subject.trim()}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-message">
                <Trans>Início da mensagem</Trans>
              </Label>
              <Textarea
                id="email-message"
                value={message}
                placeholder={t`Mensagem de abertura`}
                aria-invalid={!message.trim()}
                className="min-h-16"
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          {/* Sender info — the teacher's data goes in the e-mail (From + footer) */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <UserCircle className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="text-muted-foreground">
              {settings.data ? (
                <Trans>
                  O e-mail é enviado em nome de{' '}
                  <span className="font-semibold text-foreground">{settings.data.fromName}</span>{' '}
                  <span className="text-foreground">&lt;{settings.data.fromEmail}&gt;</span> e
                  inclui os dados do professor no rodapé, além da disciplina, prova, nota e
                  comentários.
                </Trans>
              ) : (
                <Trans>
                  O e-mail inclui automaticamente os dados do professor (nome e e-mail definidos em
                  Configurações), além da disciplina, prova, nota e comentários por questão.
                </Trans>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              <Trans>Destinatários</Trans>
            </p>
            <div className="scrollbar-subtle flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
              {students.map((s) => {
                const email = emails[s.studentId] ?? ''
                const invalid = email.trim() !== '' && !EMAIL_RE.test(email.trim())
                return (
                  <div
                    key={s.studentId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <Checkbox
                      checked={!!selected[s.studentId]}
                      onCheckedChange={(v) =>
                        setSelected((prev) => ({ ...prev, [s.studentId]: v === true }))
                      }
                      aria-label={t`Incluir ${s.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{s.name}</div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {s.matricula} · {s.total}/{s.maxTotal} pts
                      </div>
                    </div>
                    <Input
                      type="email"
                      value={email}
                      placeholder={t`e-mail do aluno`}
                      aria-label={t`E-mail de ${s.name}`}
                      aria-invalid={invalid}
                      className="h-9 w-56"
                      onChange={(e) =>
                        setEmails((prev) => ({ ...prev, [s.studentId]: maskEmail(e.target.value) }))
                      }
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <DialogFooter>
        {results ? (
          <Button onClick={onClose}>
            <Trans>Fechar</Trans>
          </Button>
        ) : (
          <>
            <DialogClose asChild>
              <Button variant="outline" disabled={sending}>
                <Trans>Cancelar</Trans>
              </Button>
            </DialogClose>
            <Button
              onClick={handleSend}
              disabled={
                sending || !configured || selectedCount === 0 || !subject.trim() || !message.trim()
              }
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <Trans>Enviar ({selectedCount})</Trans>
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  )
}

function ResultsView({ results }: { results: EmailSendResult[] }): React.JSX.Element {
  return (
    <div className="scrollbar-subtle flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
      {results.map((r) => (
        <div
          key={r.studentId}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full text-white [&_svg]:size-3.5',
              r.ok ? 'bg-success' : 'bg-destructive'
            )}
          >
            {r.ok ? <Check /> : <X />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{r.name}</div>
            <div className="truncate text-xs font-semibold text-muted-foreground">
              {r.ok ? r.email : (r.error ?? '—')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
