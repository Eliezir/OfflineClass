import { useState } from 'react'
import { Loader2, Plus, Radio } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import type { ExamSummary, GroupMode, SessionCreateInput } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { Segmented } from '@renderer/shared/ui/segmented'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/shared/ui/select'
import { Switch } from '@renderer/shared/ui/switch'

type DurationOption = '30' | '45' | '60' | '90'

type NoSessionProps = {
  provas: ExamSummary[]
  /** Pre-selected prova (e.g. arriving from the builder's "Iniciar sessão"). */
  defaultProvaId?: string
  loadingProvas: boolean
  pending: boolean
  error: string | null
  onOpen: (input: SessionCreateInput) => void
}

/** Entry state: pick a prova + options and open the lobby. */
export function NoSession({
  provas,
  defaultProvaId,
  loadingProvas,
  pending,
  error,
  onOpen
}: NoSessionProps): React.JSX.Element {
  const { t } = useLingui()
  const [provaId, setProvaId] = useState(defaultProvaId ?? '')
  const [duration, setDuration] = useState<DurationOption>('60')
  const [allowLateJoin, setAllowLateJoin] = useState(false)
  const [groupMode, setGroupMode] = useState<GroupMode>('disabled')
  const [maxGroupSize, setMaxGroupSize] = useState(4)

  const hasProvas = provas.length > 0
  // Fall back to the first prova until the teacher picks one explicitly.
  const selectedId = provaId || provas[0]?.id || ''

  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 size-[32rem] max-w-full rounded-full bg-primary/10 blur-[120px]"
      />

      {loadingProvas ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !hasProvas ? (
        /* No active session AND no exams — a single, create-exam-focused state. */
        <>
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground [&_svg]:size-6">
            <Radio />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
            <Trans>Não é possível criar uma sessão</Trans>
          </h2>
          <p className="mt-1.5 max-w-sm text-balance text-center text-sm text-muted-foreground">
            <Trans>
              Você precisa de pelo menos uma prova para abrir uma sessão. Crie uma prova para
              começar.
            </Trans>
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/provas">
              <Plus />
              <Trans>Nova prova</Trans>
            </Link>
          </Button>
        </>
      ) : (
        /* No active session, but exams exist — pick one and open the room. */
        <div className="flex w-full max-w-md flex-col items-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground [&_svg]:size-6">
            <Radio />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
            <Trans>Nenhuma sessão ativa</Trans>
          </h2>
          <p className="mt-1.5 max-w-sm text-balance text-center text-sm text-muted-foreground">
            <Trans>Escolha uma prova e abra a sala para os alunos entrarem pela rede.</Trans>
          </p>

          <div className="mt-6 w-full space-y-5 rounded-2xl border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="sessao-prova">
              <Trans>Prova</Trans>
            </Label>
            <Select value={selectedId} onValueChange={setProvaId}>
              <SelectTrigger id="sessao-prova">
                <SelectValue placeholder={t`Selecione uma prova`} />
              </SelectTrigger>
              <SelectContent>
                {provas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} · {p.questionsCount} {t`questões`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              <Trans>Duração</Trans>
            </Label>
            <Segmented
              fullWidth
              ariaLabel={t`Duração da prova`}
              value={duration}
              onChange={setDuration}
              options={[
                { value: '30', label: '30 min' },
                { value: '45', label: '45 min' },
                { value: '60', label: '60 min' },
                { value: '90', label: '90 min' }
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              <Trans>Formação de grupos</Trans>
            </Label>
            <Segmented
              fullWidth
              ariaLabel={t`Formação de grupos`}
              value={groupMode}
              onChange={setGroupMode}
              options={[
                { value: 'disabled', label: 'Individual' },
                { value: 'free', label: 'Livre' },
                { value: 'teacher', label: 'Professor' },
                { value: 'shuffle', label: 'Sorteio' }
              ]}
            />
            {groupMode !== 'disabled' && (
              <p className="text-xs text-muted-foreground">
                {groupMode === 'free'
                  ? 'Alunos criam e entram em grupos livremente no lobby.'
                  : groupMode === 'teacher'
                    ? 'Você organiza os alunos manualmente.'
                    : 'O sistema divide os alunos em grupos automaticamente.'}
              </p>
            )}
          </div>

          {groupMode !== 'disabled' && (
            <div className="space-y-1.5">
              <Label htmlFor="maxGroupSize">
                <Trans>Tamanho máximo do grupo</Trans>
              </Label>
              <Input
                id="maxGroupSize"
                type="number"
                min={2}
                max={20}
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(Number(e.target.value) || 2)}
              />
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-bold">
                <Trans>Permitir entrada após o início</Trans>
              </span>
              <span className="block text-xs text-muted-foreground">
                <Trans>Alunos atrasados ainda conseguem entrar.</Trans>
              </span>
            </span>
            <Switch checked={allowLateJoin} onCheckedChange={setAllowLateJoin} />
          </label>

          <Button
            className="w-full"
            size="lg"
            disabled={pending || !selectedId}
            onClick={() =>
              onOpen({
                examId: selectedId,
                durationMinutes: Number(duration),
                allowLateJoin,
                groupMode,
                maxGroupSize: groupMode !== 'disabled' ? maxGroupSize : undefined
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Radio />}
            <Trans>Abrir sala</Trans>
          </Button>

          {error && <p className="text-center text-sm font-semibold text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
