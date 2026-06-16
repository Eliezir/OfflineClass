import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@renderer/config/query-client'
import { meQueryOptions } from '@renderer/modules/auth/queries'
import { AuthPage } from '@renderer/modules/auth/components/auth-page'

export const Route = createFileRoute('/auth')({
  // Already signed in? Skip straight to the app.
  beforeLoad: async () => {
    const me = await queryClient.fetchQuery(meQueryOptions)
    if (me) throw redirect({ to: '/home' })
  },
  component: AuthPage
})
