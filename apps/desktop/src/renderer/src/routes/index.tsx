import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@renderer/config/query-client'
import { meQueryOptions } from '@renderer/modules/auth/queries'
import { isOnboardingComplete } from '@renderer/modules/onboarding/hooks/onboarding-storage'

/** Boot route: the native splash window has already shown by the time the
    renderer mounts here, so `/` just decides where to land — intro, login,
    or the app. */
export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    if (!isOnboardingComplete()) throw redirect({ to: '/onboarding' })
    const me = await queryClient.fetchQuery(meQueryOptions)
    throw redirect({ to: me ? '/home' : '/auth' })
  }
})
