import { useMemo, useState } from 'react'
import { ArrowLeft, ClipboardCheck, Loader2, Percent, Users } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import { SessionStat } from '@renderer/modules/sessao/components/session-stat'
import { buildMockResults } from '../mock-data'
import { useGradeAnswer, useSessionResultsQuery } from '../queries'
import { applyGrades, classAverage } from '../scoring'
import { GradedAnswerRow } from './graded-answer-row'
import { StudentResultItem } from './student-result-item'

type CorrecaoPageProps = {
  sessionId: string
  mock: boolean
}

export function CorrecaoPage({ sessionId, mock }: CorrecaoPageProps): React.JSX.Element {
  const { t } = useLingui()
  const [now] = useState(() => Date.now())
  const query = useSessionResultsQuery(sessionId, !mock)
  const grade = useGradeAnswer()

  const mockResults = useMemo(() => (mock ? buildMockResults(now) : null), [mock, now])
  const source = mock ? mockResults : (query.data ?? null)

  // Pending essay grades overlaid on the loaded data for instant feedback.
  const [grades, setGrades] = useState<Record<string, number>>({})
  const results = useMemo(() => (source ? applyGrades(source, grades) : null), [source, grades])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const students = results?.students ?? []
  const selected = students.find((s) => s.studentId === selectedId) ?? students[0] ?? null

  function handleGrade(studentId: string, questionId: string, score: number): void {
    setGrades((g) => ({ ...g, [`${studentId}:${questionId}`]: score }))
    if (!mock) grade.mutate({ sessionId, studentId, questionId, score })
  }

  const loading = !mock && query.isLoading
  const backSearch = mock ? { mock: true } : {}
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
            <Link to="/resultados" search={backSearch}>
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
        <>
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

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
            {/* Students — sticky so it stays in view while the page scrolls */}
            <section className="flex flex-col rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-2rem)] lg:w-[300px] lg:shrink-0">
              <h2 className="shrink-0 px-1 pb-2 text-sm font-bold">
                <Trans>Alunos</Trans>
              </h2>
              <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                {students.map((s) => (
                  <StudentResultItem
                    key={s.studentId}
                    student={s}
                    selected={selected?.studentId === s.studentId}
                    onSelect={() => setSelectedId(s.studentId)}
                  />
                ))}
              </div>
            </section>

            {/* Selected student's answers — grows; the page is the scroll area */}
            <section className="flex flex-col rounded-2xl border border-border bg-card p-5 lg:min-w-0 lg:flex-1">
              {selected && (
                <>
                  <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-bold tracking-tight">
                        {selected.name}
                      </h2>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {selected.matricula}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-2xl font-bold tabular-nums">
                        {selected.total}
                        <span className="text-muted-foreground">/{selected.maxTotal}</span>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">
                        <Trans>nota</Trans>
                      </div>
                    </div>
                  </header>

                  <div className="mt-3 flex flex-col gap-3">
                    {selected.answers.map((a, i) => (
                      <GradedAnswerRow
                        key={a.question.id}
                        index={i}
                        answer={a}
                        onGrade={(score) => handleGrade(selected.studentId, a.question.id, score)}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  )
}
