import { createFileRoute } from '@tanstack/react-router'
import { StudentDetailPage } from '@renderer/modules/sessao/components/student-detail-page'
import { parseMockSearch } from '@renderer/modules/sessao/search'

export const Route = createFileRoute('/_app/sessao/$studentId')({
  validateSearch: parseMockSearch,
  component: StudentDetailRoute
})

function StudentDetailRoute(): React.JSX.Element {
  const { studentId } = Route.useParams()
  const { mock } = Route.useSearch()
  return <StudentDetailPage studentId={studentId} mock={!!mock} />
}
