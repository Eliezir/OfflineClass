import { createFileRoute } from '@tanstack/react-router'
import { SessaoPage } from '@renderer/modules/sessao/components/sessao-page'

export const Route = createFileRoute('/_app/sessao')({
  component: SessaoPage
})
