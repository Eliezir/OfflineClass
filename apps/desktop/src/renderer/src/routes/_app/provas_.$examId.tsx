import { createFileRoute } from '@tanstack/react-router'
import { ExamBuilder } from '@renderer/modules/provas/components/exam-builder'

export const Route = createFileRoute('/_app/provas_/$examId')({
  component: ProvaBuilderPage
})

function ProvaBuilderPage(): React.JSX.Element {
  const { examId } = Route.useParams()
  return <ExamBuilder examId={examId} />
}
