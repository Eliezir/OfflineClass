import { createFileRoute } from '@tanstack/react-router'
import { CorrecaoPage } from '@renderer/modules/resultados/components/correcao-page'

export const Route = createFileRoute('/_app/resultados/$sessionId')({
  component: CorrecaoRoute
})

function CorrecaoRoute(): React.JSX.Element {
  const { sessionId } = Route.useParams()
  return <CorrecaoPage sessionId={sessionId} />
}
