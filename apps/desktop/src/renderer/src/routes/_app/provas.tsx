import { ClipboardList } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { ComingSoon } from '@renderer/shared/components/coming-soon'

export const Route = createFileRoute('/_app/provas')({
  component: ProvasPage
})

function ProvasPage(): React.JSX.Element {
  return (
    <ComingSoon
      title={<Trans>Provas</Trans>}
      icon={<ClipboardList />}
      description={
        <Trans>Em breve você poderá criar e organizar suas provas aqui.</Trans>
      }
    />
  )
}
