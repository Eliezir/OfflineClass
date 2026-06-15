import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@renderer/modules/home/home-page'

export const Route = createFileRoute('/_app/home')({
  component: HomePage
})
