import { createFileRoute } from '@tanstack/react-router'
import { StudentDetailPage } from '@renderer/modules/sessao/components/student-detail-page'

export const Route = createFileRoute('/_app/sessao/$studentId')({
  component: StudentDetailRoute
})

function StudentDetailRoute(): React.JSX.Element {
  const { studentId } = Route.useParams()
  return <StudentDetailPage studentId={studentId} />
}
