import { createFileRoute } from '@tanstack/react-router'
import { ProvasPage } from '@renderer/modules/provas/components/provas-page'

export const Route = createFileRoute('/_app/provas')({
  component: ProvasPage
})
