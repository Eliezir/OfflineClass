import { CheckCheck, CircleDot, Code2, FileText, ToggleLeft } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import type { QuestionKind } from '@offlineclass/shared'

type QuestionPaletteProps = {
  onAdd: (kind: QuestionKind) => void
  disabled?: boolean
}

const TYPES: {
  kind: QuestionKind
  icon: React.ReactNode
  label: React.ReactNode
  description: React.ReactNode
}[] = [
  {
    kind: 'mcq',
    icon: <CircleDot />,
    label: <Trans>Múltipla escolha</Trans>,
    description: <Trans>Alternativas com uma correta</Trans>
  },
  {
    kind: 'multi',
    icon: <CheckCheck />,
    label: <Trans>Múltiplas respostas</Trans>,
    description: <Trans>Mais de uma alternativa correta</Trans>
  },
  {
    kind: 'truefalse',
    icon: <ToggleLeft />,
    label: <Trans>Verdadeiro ou falso</Trans>,
    description: <Trans>Afirmação certa ou errada</Trans>
  },
  {
    kind: 'essay',
    icon: <FileText />,
    label: <Trans>Dissertativa</Trans>,
    description: <Trans>Resposta aberta, correção manual</Trans>
  },
  {
    kind: 'code',
    icon: <Code2 />,
    label: <Trans>Código</Trans>,
    description: <Trans>Editor de código com linguagem</Trans>
  }
]

/** Right-side palette: a card per question type. Clicking one appends a block. */
export function QuestionPalette({ onAdd, disabled }: QuestionPaletteProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Trans>Adicionar questão</Trans>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          <Trans>Escolha um tipo para inserir na prova.</Trans>
        </p>
      </div>

      <div className="space-y-2">
        {TYPES.map((type) => (
          <button
            key={type.kind}
            type="button"
            disabled={disabled}
            onClick={() => onAdd(type.kind)}
            className="group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground [&_svg]:size-5">
              {type.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{type.label}</span>
              <span className="block text-xs text-muted-foreground">{type.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
