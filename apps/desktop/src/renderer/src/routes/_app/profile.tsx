import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@renderer/modules/auth/components/profile-page'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage
})
