import { createFileRoute } from '@tanstack/react-router'
import { CorrecaoPage } from '@renderer/modules/resultados/components/correcao-page'
import { parseMockSearch } from '@renderer/modules/sessao/search'

export const Route = createFileRoute('/_app/resultados/$sessionId')({
  validateSearch: parseMockSearch,
  component: CorrecaoRoute
})

function CorrecaoRoute(): React.JSX.Element {
  const { sessionId } = Route.useParams()
  const { mock } = Route.useSearch()
  return <CorrecaoPage sessionId={sessionId} mock={!!mock} />
}
