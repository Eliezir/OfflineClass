import { ChartColumn } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { ComingSoon } from '@renderer/shared/components/coming-soon'

export const Route = createFileRoute('/_app/resultados')({
  component: ResultadosPage
})

function ResultadosPage(): React.JSX.Element {
  return (
    <ComingSoon
      title={<Trans>Resultados</Trans>}
      icon={<ChartColumn />}
      description={
        <Trans>Em breve você verá notas, correções e relatórios das sessões encerradas aqui.</Trans>
      }
    />
  )
}
