import { createFileRoute } from '@tanstack/react-router'
import { SessaoPage } from '@renderer/modules/sessao/components/sessao-page'
import { parseMockSearch } from '@renderer/modules/sessao/search'

export const Route = createFileRoute('/_app/sessao/')({
  validateSearch: parseMockSearch,
  component: SessaoRoute
})

function SessaoRoute(): React.JSX.Element {
  const { mock } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <SessaoPage
      mockMode={!!mock}
      onToggleMock={() => navigate({ search: { mock: mock ? undefined : true } })}
    />
  )
}
