import { CheckCircle2, ListChecks, PenLine, Users } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import type { SessionDetail } from '../types'
import { SessionStat } from './session-stat'
import { StudentProgressRow } from './student-progress-row'

type LiveDashboardProps = {
  session: SessionDetail
  now: number
}

/** Running state: metric strip + live per-student progress table. */
export function LiveDashboard({ session, now }: LiveDashboardProps): React.JSX.Element {
  const total = session.students.length
  const submitted = session.students.filter((s) => s.submittedAt !== null).length
  const working = total - submitted

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
            />
          ))}
        </div>

        <p className="shrink-0 pt-2 text-xs font-semibold text-muted-foreground">
          <Trans>
            {submitted} de {total} alunos entregaram
          </Trans>
        </p>
      </section>
    </div>
  )
}
