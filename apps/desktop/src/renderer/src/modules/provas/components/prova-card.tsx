import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardList, Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  Popover,
  PopoverContent,
  PopoverItem,
  PopoverSeparator,
  PopoverTrigger
} from '@renderer/shared/ui/popover'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import type { ExamSummary } from '../schemas'

type ProvaCardProps = {
  prova: ExamSummary
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function ProvaCard({
  prova,
  onEdit,
  onDuplicate,
  onDelete
}: ProvaCardProps): React.JSX.Element {
  const { t } = useLingui()
  const [menuOpen, setMenuOpen] = useState(false)

  const run = (fn: () => void) => () => {
    setMenuOpen(false)
    fn()
  }

  const subtitle = [prova.subject, prova.gradeLevel].filter(Boolean).join(' · ')

  return (
    <div className="group relative rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t`Opções da prova`}
            className="absolute right-2.5 top-2.5 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition-[opacity,background-color,color] hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:bg-muted data-[state=open]:text-foreground data-[state=open]:opacity-100 [&_svg]:size-4"
          >
            <MoreVertical />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48">
          <PopoverItem icon={<Pencil />} title={t`Editar dados`} onClick={run(onEdit)} />
          <PopoverItem icon={<Copy />} title={t`Duplicar`} onClick={run(onDuplicate)} />
          <PopoverSeparator />
          <PopoverItem
            icon={<Trash2 />}
            title={t`Excluir`}
            onClick={run(onDelete)}
            className="hover:bg-destructive/10"
            iconClassName="group-hover:bg-destructive/15 group-hover:text-destructive"
          />
        </PopoverContent>
      </Popover>

      <Link
        to="/provas/$examId"
        params={{ examId: prova.id }}
        className="flex h-full flex-col gap-3 p-4"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-xl text-primary [&_svg]:size-5">
          {prova.icon ? prova.icon : <ClipboardList />}
        </span>
        <div className="flex-1">
          <div className="line-clamp-2 pr-8 font-bold leading-snug">{prova.title}</div>
          {subtitle && (
            <div className="mt-0.5 line-clamp-1 text-xs font-semibold text-muted-foreground">
              {subtitle}
            </div>
          )}
          <div className="mt-1 text-xs font-semibold text-muted-foreground">
            {prova.questionsCount} <Trans>questões</Trans> · {formatRelativeTime(prova.updatedAt)}
          </div>
        </div>
      </Link>
    </div>
  )
}
