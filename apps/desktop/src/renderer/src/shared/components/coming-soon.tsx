import { Trans } from '@lingui/react/macro'
import { PageHeader } from './page-header'

type ComingSoonProps = {
  title: React.ReactNode
  description?: React.ReactNode
  icon: React.ReactNode
}

/** Placeholder page for routes whose feature isn't built yet (provas, sessão,
    resultados). Keeps the nav navigable instead of 404-ing during the refactor. */
export function ComingSoon({ title, description, icon }: ComingSoonProps): React.JSX.Element {
  return (
    <main className="flex flex-1 flex-col px-6 pb-6">
      <PageHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary [&_svg]:size-6">
          {icon}
        </div>
        <p className="text-base font-bold">
          <Trans>Em breve</Trans>
        </p>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </main>
  )
}
