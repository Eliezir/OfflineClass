import { ArrowLeft, CheckCircle2, ListChecks, Loader2, Percent, Target } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import type { SessionAnswersReview, SessionLobbyStudent } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import { useActiveSessionQuery, useStudentAnswersQuery } from '../queries'
import { useSessaoClock } from '../use-sessao-clock'
import { deriveStudentStatus } from '../student-status'
import { AnswerRow } from './answer-row'
import { Countdown } from './countdown'
import { SessionStat } from './session-stat'
import { StatusPill } from './status-pill'
import { StudentAvatar } from './student-avatar'
import { StudentStatusBadge } from './student-status-badge'

type StudentDetailPageProps = {
  studentId: string
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps): React.JSX.Element {
  const { t } = useLingui()
  const { now } = useSessaoClock()
  const active = useActiveSessionQuery()

  const session = active.data ?? null
  const student = session?.students.find((s) => s.id === studentId) ?? null

  const answersQuery = useStudentAnswersQuery(session?.id, studentId, true)
  const review = answersQuery.data ?? null

  const loading = active.isLoading || answersQuery.isLoading

  return (
    <main className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-6 pb-6">
      <div className="flex items-center justify-between gap-3 pt-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/sessao">
            <ArrowLeft />
            <Trans>Voltar para a sessão</Trans>
          </Link>
        </Button>
        {session && session.status === 'running' && (
          <div className="flex items-center gap-2">
            <StatusPill status={session.status} />
            {session.startedAt && (
              <Countdown startedAt={session.startedAt} durationMinutes={session.durationMinutes} />
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !student ? (
        <EmptyState
          icon={<Target />}
          title={t`Aluno não encontrado`}
          description={
            <Trans>Este aluno não faz parte da sessão ativa ou a sessão foi encerrada.</Trans>
          }
          action={
            <Button asChild>
              <Link to="/sessao">
                <ArrowLeft />
                <Trans>Voltar para a sessão</Trans>
              </Link>
            </Button>
          }
        />
      ) : (
        <StudentDetail
          student={student}
          groupName={session?.groups?.find((g) => g.members.some((m) => m.studentId === studentId))?.name}
          questionsCount={session?.questionsCount ?? review?.answers.length ?? 0}
          review={review}
          now={now}
          sessionId={session?.id ?? ''}
          studentId={studentId}
        />
      )}
    </main>
  )
}

function StudentDetail({
  student,
  groupName,
  questionsCount,
  review,
  now,
  sessionId,
  studentId
}: {
  student: SessionLobbyStudent
  groupName?: string
  questionsCount: number
  review: SessionAnswersReview | null
  now: number
  sessionId: string
  studentId: string
}): React.JSX.Element {
  const status = deriveStudentStatus(student, now)
  const answered = student.answeredCount
  const pct = questionsCount > 0 ? Math.round((answered / questionsCount) * 100) : 0

  const mcq = review?.answers.filter((a) => a.question.kind === 'mcq') ?? []
  const mcqCorrect = mcq.filter((a) => a.correct === true).length

  return (
    <>
      {/* Hero */}
      <header className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <StudentAvatar name={student.name} avatar={student.avatar} className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>{student.name}</span>
            {groupName && (
              <span className="inline-flex shrink-0 items-center rounded bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-soft-foreground uppercase tracking-wider">
                {groupName}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
            {student.matricula} · <Trans>entrou {formatRelativeTime(student.joinedAt)}</Trans>
            {status !== 'submitted' && (
              <>
                {' · '}
                <Trans>ativo {formatRelativeTime(student.lastSeenAt)}</Trans>
              </>
            )}
          </p>
        </div>
        <StudentStatusBadge status={status} />
      </header>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SessionStat
          tone="primary"
          icon={<ListChecks />}
          value={`${answered}/${questionsCount}`}
          label={<Trans>Respondidas</Trans>}
        />
        <SessionStat
          tone="tertiary"
          icon={<Percent />}
          value={`${pct}%`}
          label={<Trans>Progresso</Trans>}
        />
        <SessionStat
          tone="secondary"
          icon={<Target />}
          value={`${mcqCorrect}/${mcq.length}`}
          label={<Trans>Acertos (objetivas)</Trans>}
        />
        <SessionStat
          tone="neutral"
          icon={<CheckCircle2 />}
          value={status === 'submitted' ? <Trans>Entregue</Trans> : <Trans>Em curso</Trans>}
          label={<Trans>Estado</Trans>}
        />
      </div>

      {/* Questions */}
      <h2 className="mt-6 mb-3 text-sm font-bold">
        <Trans>Respostas</Trans>
      </h2>
      {review ? (
        <div className="space-y-3">
          {review.answers.map((r, i) => (
            <AnswerRow
              key={r.question.id}
              index={i}
              review={r}
              sessionId={sessionId}
              studentId={studentId}
            />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          <Trans>Não foi possível carregar as respostas.</Trans>
        </p>
      )}
    </>
  )
}
