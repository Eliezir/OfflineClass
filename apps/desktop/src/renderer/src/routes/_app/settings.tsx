import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@renderer/modules/settings/components/settings-page'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage
})
