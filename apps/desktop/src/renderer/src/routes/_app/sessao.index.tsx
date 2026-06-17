import { createFileRoute } from '@tanstack/react-router'
import { SessaoPage } from '@renderer/modules/sessao/components/sessao-page'

type SessaoSearch = { examId?: string }

export const Route = createFileRoute('/_app/sessao/')({
  validateSearch: (search: Record<string, unknown>): SessaoSearch => ({
    examId: typeof search.examId === 'string' ? search.examId : undefined
  }),
  component: SessaoRoute
})

function SessaoRoute(): React.JSX.Element {
  const { examId } = Route.useSearch()
  return <SessaoPage initialExamId={examId} />
}
