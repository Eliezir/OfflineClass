import { CheckCircle2, ListChecks, PenLine, Users, Terminal } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import type { SessionDetail } from '../types'
import { SessionStat } from './session-stat'
import { StudentProgressRow } from './student-progress-row'
import { Button } from '@renderer/shared/ui/button'

type LiveDashboardProps = {
  session: SessionDetail
  now: number
  onSelectStudent: (studentId: string) => void
  onSelectGroup: (groupId: string) => void
}

/** Running state: metric strip + live per-student progress table. */
export function LiveDashboard({
  session,
  now,
  onSelectStudent,
  onSelectGroup
}: LiveDashboardProps): React.JSX.Element {
  const { t } = useLingui()
  const total = session.students.length
  const submitted = session.students.filter((s) => s.submittedAt !== null).length
  const working = total - submitted

  const isGroupMode = session.groupMode !== 'disabled'
  const groups = session.groups || []
  const studentsInGroups = new Set(groups.flatMap((g) => g.members.map((m) => m.studentId)))
  const unassignedStudents = session.students.filter((s) => !studentsInGroups.has(s.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        <SessionStat tone="primary" icon={<Users />} value={total} label={<Trans>Alunos</Trans>} />
        <SessionStat
          tone="tertiary"
          icon={<PenLine />}
          value={working}
          label={<Trans>Respondendo</Trans>}
        />
        <SessionStat
          tone="secondary"
          icon={<CheckCircle2 />}
          value={submitted}
          label={<Trans>Entregues</Trans>}
        />
        <SessionStat
          tone="neutral"
          icon={<ListChecks />}
          value={session.questionsCount}
          label={<Trans>Questões</Trans>}
        />
      </div>

      {isGroupMode ? (
        <div className="scrollbar-subtle flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
          {groups.map((g) => {
            const groupStudents = g.members
              .map((m) => session.students.find((s) => s.id === m.studentId))
              .filter((s): s is NonNullable<typeof s> => s !== undefined)

            const groupSubmitted = groupStudents.filter((s) => s.submittedAt !== null).length

            return (
              <div
                key={g.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4 shrink-0"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Users className="size-4.5 text-primary" />
                      <span>{g.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {groupStudents.length} {t`membros`} · {groupSubmitted} {t`entregaram`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onSelectGroup(g.id)}
                      className="flex items-center gap-1.5"
                    >
                      <Terminal className="size-3.5" />
                      <Trans>Abrir Y.Doc (Tempo Real)</Trans>
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/40">
                  {groupStudents.map((student) => (
                    <StudentProgressRow
                      key={student.id}
                      student={student}
                      questionsCount={session.questionsCount}
                      now={now}
                      onSelect={() => onSelectStudent(student.id)}
                    />
                  ))}
                  {groupStudents.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      <Trans>Nenhum aluno neste grupo</Trans>
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {unassignedStudents.length > 0 && (
            <div className="rounded-2xl border border-border border-dashed bg-card/50 p-5 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/40">
                <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <Users className="size-4" />
                  <span><Trans>Sem Grupo</Trans></span>
                </h3>
              </div>
              <div className="divide-y divide-border/40">
                {unassignedStudents.map((student) => (
                  <StudentProgressRow
                    key={student.id}
                    student={student}
                    questionsCount={session.questionsCount}
                    now={now}
                    onSelect={() => onSelectStudent(student.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-5">
          <div className="flex shrink-0 items-center gap-3 border-b border-border/60 pb-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            <span className="flex-1">
              <Trans>Aluno</Trans>
            </span>
            <span className="hidden w-40 shrink-0 sm:block">
              <Trans>Progresso</Trans>
            </span>
            <span className="hidden w-24 shrink-0 text-right md:block">
              <Trans>Atividade</Trans>
            </span>
            <span className="w-24 shrink-0 text-right">
              <Trans>Status</Trans>
            </span>
          </div>

          <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto pr-1">
            {session.students.map((s) => (
              <StudentProgressRow
                key={s.id}
                student={s}
                questionsCount={session.questionsCount}
                now={now}
                onSelect={() => onSelectStudent(s.id)}
              />
            ))}
          </div>

          <p className="shrink-0 pt-2 text-xs font-semibold text-muted-foreground">
            <Trans>
              {submitted} de {total} alunos entregaram
            </Trans>
          </p>
        </section>
      )}
    </div>
  )
}
