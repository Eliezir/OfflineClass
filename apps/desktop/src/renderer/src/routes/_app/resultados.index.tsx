import { createFileRoute } from '@tanstack/react-router'
import { ResultadosPage } from '@renderer/modules/resultados/components/resultados-page'
import { parseMockSearch } from '@renderer/modules/sessao/search'

export const Route = createFileRoute('/_app/resultados/')({
  validateSearch: parseMockSearch,
  component: ResultadosRoute
})

function ResultadosRoute(): React.JSX.Element {
  const { mock } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <ResultadosPage
      mockMode={!!mock}
      onToggleMock={() => navigate({ search: { mock: mock ? undefined : true } })}
    />
  )
}
