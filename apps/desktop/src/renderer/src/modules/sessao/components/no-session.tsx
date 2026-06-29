import { useState } from 'react'
import { ClipboardList, Loader2, Plus, Radio } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import type { ExamSummary, GroupMode, SessionCreateInput } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
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
  const [scrambleQuestions, setScrambleQuestions] = useState(false)
  const [scrambleOptions, setScrambleOptions] = useState(false)
  const [groupMode, setGroupMode] = useState<GroupMode>('disabled')
  const [maxGroupSize, setMaxGroupSize] = useState(4)

  const hasProvas = provas.length > 0
  const selectedId = provaId || provas[0]?.id || ''

  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center w-full h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 size-[32rem] max-w-full rounded-full bg-primary/10 blur-[120px]"
      />

      {!loadingProvas && !hasProvas ? (
        <EmptyState
          className="flex-none"
          icon={<ClipboardList />}
          title={t`Nenhuma prova ainda`}
          description={<Trans>Crie uma prova antes de aplicar uma sessão.</Trans>}
          action={
            <Button asChild>
              <Link to="/provas">
                <Plus />
                <Trans>Nova prova</Trans>
              </Link>
            </Button>
          }
        />
      ) : loadingProvas ? (
        <div className="flex h-40 w-full max-w-md items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl md:shadow-2xl flex flex-col gap-6 md:gap-8 transition-all animate-in fade-in duration-300 overflow-y-auto max-h-full scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column: General Configuration */}
            <div className="space-y-5">
              <div className="border-b border-border/60 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Trans>Configurações Gerais</Trans>
                </h3>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sessao-prova" className="text-sm font-semibold">
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
                <Label className="text-sm font-semibold">
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
                <Label className="text-sm font-semibold">
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
                  <p className="text-[11px] leading-relaxed text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/30 mt-1">
                    {groupMode === 'free'
                      ? 'Alunos criam e entram em grupos livremente no lobby.'
                      : groupMode === 'teacher'
                        ? 'Você organiza os alunos manualmente.'
                        : 'O sistema divide os alunos em grupos automaticamente.'}
                  </p>
                )}
              </div>

              {groupMode !== 'disabled' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="maxGroupSize" className="text-sm font-semibold">
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
            </div>

            {/* Right Column: Advanced Configuration */}
            <div className="space-y-5">
              <div className="border-b border-border/60 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  <Trans>Regras & Segurança</Trans>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:bg-muted/30 hover:border-border/80">
                  <label className="flex cursor-pointer items-start justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <span className="block text-sm font-semibold">
                        <Trans>Permitir entrada tardia</Trans>
                      </span>
                      <span className="block text-[11px] text-muted-foreground leading-normal">
                        <Trans>Alunos atrasados ainda conseguem entrar após o início da prova.</Trans>
                      </span>
                    </div>
                    <Switch checked={allowLateJoin} onCheckedChange={setAllowLateJoin} className="mt-0.5" />
                  </label>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:bg-muted/30 hover:border-border/80">
                  <label className="flex cursor-pointer items-start justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <span className="block text-sm font-semibold">
                        <Trans>Embaralhar questões</Trans>
                      </span>
                      <span className="block text-[11px] text-muted-foreground leading-normal">
                        <Trans>Cada grupo ou aluno individual vê as questões em ordens distintas.</Trans>
                      </span>
                    </div>
                    <Switch checked={scrambleQuestions} onCheckedChange={setScrambleQuestions} className="mt-0.5" />
                  </label>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:bg-muted/30 hover:border-border/80">
                  <label className="flex cursor-pointer items-start justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <span className="block text-sm font-semibold">
                        <Trans>Embaralhar opções MCQ</Trans>
                      </span>
                      <span className="block text-[11px] text-muted-foreground leading-normal">
                        <Trans>As alternativas de múltipla escolha e múltipla resposta mudam de ordem.</Trans>
                      </span>
                    </div>
                    <Switch checked={scrambleOptions} onCheckedChange={setScrambleOptions} className="mt-0.5" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Centered actions footer */}
          <div className="border-t border-border/60 pt-6 flex flex-col items-center gap-4">
            <Button
              className="w-full max-w-sm cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
              size="lg"
              disabled={pending || !selectedId}
              onClick={() =>
                onOpen({
                  examId: selectedId,
                  durationMinutes: Number(duration),
                  allowLateJoin,
                  scrambleQuestions,
                  scrambleOptions,
                  groupMode,
                  maxGroupSize: groupMode !== 'disabled' ? maxGroupSize : undefined
                })
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : <Radio className="animate-pulse" />}
              <span className="font-bold tracking-wide"><Trans>Abrir sala de prova</Trans></span>
            </Button>

            {error && <p className="text-center text-sm font-semibold text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
