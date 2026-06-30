import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Download,
  Loader2,
  LogOut,
  Mail,
  MailCheck,
  Percent,
  Play,
  Printer,
  Send,
  StopCircle,
  UserPlus,
  Users
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { cn } from '@renderer/shared/utils'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import { SessionStat } from '@renderer/modules/sessao/components/session-stat'
import { StudentAvatar } from '@renderer/modules/sessao/components/student-avatar'
import {
  useCommentAnswer,
  useCommentStudent,
  useGradeAnswer,
  useSessionResultsQuery
} from '../queries'
import { applyGrades, classAverage } from '../scoring'
import { EmailDialog } from './email-dialog'
import { GradedAnswerRow } from './graded-answer-row'
import { StudentRemark } from './student-remark'
import type { SessionResults, StudentResult } from '../types'

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min > 0) return `${min}min ${sec}s`
  return `${sec}s`
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtFull(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR')
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

async function downloadPdf(results: SessionResults): Promise<void> {
  const base64 = await window.api.exportPdf()
  if (!base64) return
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${results.examTitle.replace(/[^a-z0-9]/gi, '_')}_resultados.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadCsv(results: SessionResults): void {
  const { students, examTitle } = results
  const questionHeaders = students[0]?.answers.map((_, i) => `Q${i + 1}`) ?? []

  const header = [
    'Nome',
    'Matrícula',
    'Entrou',
    'Saiu',
    'Tempo',
    'Respondeu',
    'Submeteu',
    ...questionHeaders,
    'Nota',
    'Nota Máx'
  ]
    .map(escapeCsv)
    .join(',')

  const rows = students.map((s) => {
    const duration = s.leftAt && s.joinedAt ? formatDuration(s.leftAt - s.joinedAt) : '—'
    const scores = s.answers.map((a) => (a.awarded !== null ? a.awarded.toString() : '—'))
    return [
      s.name,
      s.matricula,
      fmtFull(s.joinedAt),
      s.leftAt ? fmtFull(s.leftAt) : '—',
      duration,
      s.answeredCount.toString(),
      s.submittedAt ? fmtFull(s.submittedAt) : '—',
      ...scores,
      s.total.toString(),
      s.maxTotal.toString()
    ]
      .map(escapeCsv)
      .join(',')
  })

  const bom = '\uFEFF'
  const csv = bom + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${examTitle.replace(/[^a-z0-9]/gi, '_')}_resultados.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface TimelineEvent {
  time: string
  icon: React.ReactNode
  label: string
  ts: number
}

function buildTimeline(students: StudentResult[], results: SessionResults | null): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (results?.endedAt) {
    const firstJoin = students.reduce((min, s) => (s.joinedAt < min ? s.joinedAt : min), Infinity)
    if (firstJoin !== Infinity) {
      events.push({
        time: fmt(firstJoin - 1000),
        icon: <Play className="size-3.5 text-success" />,
        label: 'Sessão iniciada',
        ts: firstJoin - 1000
      })
    }
  }

  for (const s of students) {
    events.push({
      time: fmt(s.joinedAt),
      icon: <UserPlus className="size-3.5 text-primary" />,
      label: `${s.name} entrou`,
      ts: s.joinedAt
    })
    if (s.leftAt && !s.submittedAt) {
      events.push({
        time: fmt(s.leftAt),
        icon: <LogOut className="size-3.5 text-warning" />,
        label: `${s.name} saiu`,
        ts: s.leftAt
      })
    }
    if (s.submittedAt) {
      events.push({
        time: fmt(s.submittedAt),
        icon: <Send className="size-3.5 text-success" />,
        label: `${s.name} enviou a prova`,
        ts: s.submittedAt
      })
    }
    if (s.leftAt && s.submittedAt && s.leftAt !== s.submittedAt) {
      events.push({
        time: fmt(s.leftAt),
        icon: <LogOut className="size-3.5 text-muted-foreground" />,
        label: `${s.name} saiu`,
        ts: s.leftAt
      })
    }
  }

  if (results?.endedAt) {
    events.push({
      time: fmt(results.endedAt),
      icon: <StopCircle className="size-3.5 text-destructive" />,
      label: 'Sessão encerrada',
      ts: results.endedAt
    })
  }

  events.sort((a, b) => a.ts - b.ts)
  return events
}

type CorrecaoPageProps = {
  sessionId: string
}

export function CorrecaoPage({ sessionId }: CorrecaoPageProps): React.JSX.Element {
  const { t } = useLingui()
  const query = useSessionResultsQuery(sessionId)
  const grade = useGradeAnswer()
  const comment = useCommentAnswer(sessionId)
  const remark = useCommentStudent(sessionId)

  const source = query.data ?? null

  const [grades, setGrades] = useState<Record<string, number>>({})
  const results = useMemo(() => (source ? applyGrades(source, grades) : null), [source, grades])

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const students = results?.students ?? []

  function handleGrade(studentId: string, questionId: string, score: number): void {
    setGrades((g) => ({ ...g, [`${studentId}:${questionId}`]: score }))
    grade.mutate({ sessionId, studentId, questionId, score })
  }

  function handleComment(studentId: string, questionId: string, text: string): Promise<unknown> {
    return comment.mutateAsync({ studentId, questionId, comment: text })
  }

  function handleRemark(studentId: string, text: string): Promise<unknown> {
    return remark.mutateAsync({ studentId, comment: text })
  }

  const loading = query.isLoading
  const average = classAverage(students)
  const maxTotal = students[0]?.maxTotal ?? 0
  const pendingCount = students.filter((s) =>
    s.answers.some((a) => a.question.kind === 'essay' && a.value !== null && a.awarded === null)
  ).length

  return (
    <main className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/resultados">
              <ArrowLeft />
              <Trans>Resultados</Trans>
            </Link>
          </Button>
          {results && (
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold tracking-tight">
                {results.examTitle}
              </h1>
              {results.endedAt && (
                <p className="text-xs font-semibold text-muted-foreground">
                  <Trans>encerrada</Trans> {formatRelativeTime(results.endedAt)}
                </p>
              )}
            </div>
          )}
        </div>
        {results && students.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv(results)}>
              <Download className="size-3.5" />
              <Trans>Exportar CSV</Trans>
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPdf(results)}>
              <Printer className="size-3.5" />
              <Trans>Exportar PDF</Trans>
            </Button>
            <Button size="sm" onClick={() => setEmailOpen(true)}>
              <Mail className="size-3.5" />
              <Trans>Enviar notas por e-mail</Trans>
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !results || students.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={t`Nenhum aluno`}
          description={<Trans>Esta sessão não teve alunos com respostas.</Trans>}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* ── Stats ────────────────────────────────────────────────── */}
          <div className="mt-4 grid shrink-0 grid-cols-3 gap-4">
            <SessionStat
              tone="primary"
              icon={<Users />}
              value={students.length}
              label={<Trans>Alunos</Trans>}
            />
            <SessionStat
              tone="secondary"
              icon={<Percent />}
              value={average !== null ? `${average.toFixed(1)}/${maxTotal}` : '—'}
              label={<Trans>Média da turma</Trans>}
            />
            <SessionStat
              tone="tertiary"
              icon={<ClipboardCheck />}
              value={pendingCount}
              label={<Trans>A corrigir</Trans>}
            />
          </div>

          {/* ── Collapsible student cards ────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {students.map((student) => {
              const open = expandedId === student.studentId
              const pending = student.answers.some(
                (a) => a.question.kind === 'essay' && a.value !== null && a.awarded === null
              )
              return (
                <div key={student.studentId} className="rounded-2xl border border-border bg-card">
                  {/* ── Card header (always visible) ─────────────────── */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : student.studentId)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <StudentAvatar name={student.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">{student.name}</span>
                        {student.resultsSentAt && (
                          <span
                            title={t`Enviado em ${new Date(student.resultsSentAt).toLocaleString('pt-BR')}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success"
                          >
                            <MailCheck className="size-3" />
                            <Trans>E-mail enviado</Trans>
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {student.matricula}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums">
                          {student.total}
                          <span className="text-muted-foreground">/{student.maxTotal}</span>
                        </div>
                        {pending && (
                          <div className="text-[10px] font-bold text-tertiary-soft-foreground">
                            {t`a corrigir`}
                          </div>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'text-muted-foreground size-4 transition-transform duration-200',
                          open && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>

                  {/* ── Expanded details ──────────────────────────────── */}
                  {open && (
                    <div className="border-t border-border/60 px-5 pb-5">
                      {/* Audit log */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-3 text-xs items-start">
                        <div>
                          <span className="text-muted-foreground">Entrou</span>
                          <p className="font-semibold">
                            {new Date(student.joinedAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saiu</span>
                          <p className="font-semibold">
                            {student.leftAt
                              ? new Date(student.leftAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Respondeu</span>
                          <p className="font-semibold">{student.answeredCount} questões</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submeteu</span>
                          <p className="font-semibold">
                            {student.submittedAt
                              ? new Date(student.submittedAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tempo na prova</span>
                          <p className="font-semibold">
                            {student.leftAt && student.joinedAt
                              ? formatDuration(student.leftAt - student.joinedAt)
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Nota</span>
                          <p className="font-semibold">
                            {student.submittedAt ? `${student.total} / ${student.maxTotal}` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Answers */}
                      <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
                        {student.answers.map((a, i) => (
                          <GradedAnswerRow
                            key={a.question.id}
                            index={i}
                            answer={a}
                            onGrade={(score) =>
                              handleGrade(student.studentId, a.question.id, score)
                            }
                            onComment={(text) =>
                              handleComment(student.studentId, a.question.id, text)
                            }
                          />
                        ))}
                      </div>

                      {/* Overall remark (sent in the grade e-mail) */}
                      <StudentRemark
                        feedback={student.feedback}
                        onSave={(text) => handleRemark(student.studentId, text)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Clock className="size-4" />
              <Trans>Linha do tempo</Trans>
            </h2>
            <div className="mt-3 space-y-1.5">
              {buildTimeline(students, results).map((event, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 w-10 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                    {event.time}
                  </span>
                  <span className="mt-0.5 shrink-0">{event.icon}</span>
                  <span className="text-muted-foreground">{event.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && (
        <EmailDialog
          sessionId={sessionId}
          examTitle={results.examTitle}
          examSubject={results.examSubject}
          students={students}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      )}
    </main>
  )
}
