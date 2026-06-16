import { createFileRoute, redirect } from '@tanstack/react-router'
import { isOnboardingComplete } from '@renderer/modules/onboarding/hooks/onboarding-storage'

/** Boot route: the native splash window has already shown by the time the
    renderer mounts here, so `/` just decides where to land. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: isOnboardingComplete() ? '/home' : '/onboarding' })
  }
})
