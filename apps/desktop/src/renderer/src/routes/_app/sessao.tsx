import { Radio } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { ComingSoon } from '@renderer/shared/components/coming-soon'

export const Route = createFileRoute('/_app/sessao')({
  component: SessaoPage
})

function SessaoPage(): React.JSX.Element {
  return (
    <ComingSoon
      title={<Trans>Sessão</Trans>}
      icon={<Radio />}
      description={
        <Trans>Em breve você poderá aplicar provas ao vivo e acompanhar os grupos aqui.</Trans>
      }
    />
  )
}
