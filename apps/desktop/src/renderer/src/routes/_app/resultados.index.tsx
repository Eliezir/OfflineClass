import { createFileRoute } from '@tanstack/react-router'
import { ResultadosPage } from '@renderer/modules/resultados/components/resultados-page'

export const Route = createFileRoute('/_app/resultados/')({
  component: ResultadosRoute
})

function ResultadosRoute(): React.JSX.Element {
  return <ResultadosPage />
}
